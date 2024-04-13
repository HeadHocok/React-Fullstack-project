const {prisma} = require("../prisma/prisma-client");
const bcrypt = require("bcryptjs");
const jdenticon = require('jdenticon');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken')
const {response} = require("express");

const UserController = { //ответ серверной части на запрос
    register: async (req, res) => {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        try {
            const existingUser = await prisma.user.findUnique(({ where: { email } })); //есть ли у нас уже такой пользователь с email?

            if (existingUser) {
                return res.status(400).json({ error: 'Пользователь уже существует' });
            }

            const hashedPassword = await bcrypt.hash(password, 10); //10 - salt.

            const png = jdenticon.toPng(`${name}${Date.now()}`, 200);
            const avatarName = `${name}_${Date.now()}.png`;
            const avatarPath = path.join(__dirname, '/../uploads', avatarName); //путь для аватара
            fs.writeFileSync(avatarPath, png) //добавляем в папку uploads

            const user = await prisma.user.create({ //создаем пользователя
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    avatarUrl: `/uploads/${avatarName}`
                }
            })

            res.json(user);

        } catch (error) {
            console.error('Error in register', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    login: async (req, res) => {
        const { email, password } = req.body; //body - это то, что реквест передал в качестве ключей

        if (!email || !password) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        try {
            const user = await prisma.user.findUnique(({ where: { email } })); //есть ли у нас уже такой пользователь с email?

            if (!user) {
                return res.status(400).json({ error: 'Неверный логин или пароль' });
            }

            const valid = await bcrypt.compare(password, user.password); //проверяем совпадает ли пароль с тем пользователем что нашли

            if (!valid) {
                return res.status(400).json({ error: 'Неверный логин или пароль' });
            }

            const token = jwt.sign(({ userId: user.id }), process.env.SECRET_KEY) //шифруем в токене айди пользователя

            res.json({ token })
        } catch (error) {
            console.log('Login error', error);
            res.status(500).json({ error: "Internal server error" })
        }
    },
    getUserById: async (req, res) => { //запрашиваем пользователя (не нашего)
        const { id } = req.params; //params это то, что реквест передал в качестве параметров (пользователя которого запрашиваем)
        const userId = req.user.userId; //id пользователя который запрашивает

        console.log(userId)

        try {
            const user = await prisma.user.findUnique({
                where: { id },
                include: { //если нашёл user id значит пришли всех followers following
                    followers: true,
                    following: true,
                }
            });

            if (!user) {
                return res.status(404).json({ error: 'User is not found' })
            }

            const isFollowing = await prisma.follows.findFirst({ //проверяем подписаны ли мы на пользователя
                where: {
                    AND: [
                        { followerId: userId }, //мы
                        { followingId: id }, //на пользователя
                    ]
                }
            })

            res.json({ ...user, isFollowing: Boolean(isFollowing) }) //возвращаем пользователя и ответ: подписаны ли на него
        } catch (error) {
            console.log('Get current error', error)
            res.status(500).json({  error: 'Internal server error'  });
        }
    },
    updateUser: async (req, res) => {
        const { id } = req.params; //params это то, что реквест передал в качестве параметров (пользователя которого запрашиваем)
        const { email, name, dateOfBirth, bio, location } = req.body; //id пользователя который запрашивает

        let filePath;

        if (req.file && req.file.path) { //если мы обновляем пользователя и если мы обновили картинку, то мы проверяем, обновил ли multer
            filePath = req.file.path;
        }

        console.log(id, req.user)

        if (id !== req.user.userId) {
            return res.status(403).json({  error: 'No access'  }); //случай редкий, но пользователь может обновлять не свои данные, или он не авторизирован
        }

        try {
            if (email) { //если изменяет email, то мы должны снова проверить его на уникальность
                const existingUser = await prisma.user.findFirst({
                    where: {email: email}
                })

                if (existingUser && existingUser.id !== id) {
                    return res.status(400).json({ error: 'Почта уже используется' })
                }
            }

            const user = await prisma.user.update({
                where: { id },
                data: {
                    email: email || undefined,
                    name: name || undefined,
                    avatarUrl: filePath ? `/${filePath}` : undefined,
                    dateOfBirth: dateOfBirth || undefined,
                    bio: bio || undefined,
                    location: location || undefined,
                }
            })

            res.json(user);
        } catch (error) {
            console.error('Update user error', error);
            return res.status(500).json({ error: 'Internal server error' })
        }
    },
    current: async (req, res) => { //авторизация (не аутентификация) пользователя по идентификатору (расшифрованному токену)
        try {
            const user = await prisma.user.findUnique({
                where: {
                    id: req.user.userId,
                },
                include: {
                    followers: { //Запрос включает информацию о подписчиках пользователя...
                        include: {
                            follower: true,
                        },
                    },
                    following: { //...и о тех, на кого пользователь подписан
                        include: {
                            following: true,
                        }
                    }
                }
            })

            if (!user) {
                return res.status(400).json({ error: 'Не удалось найти пользователя' })
            }

            res.json(user);

        } catch (error) {
            console.error('Get Current Error', error);

            return res.status(500).json({ error: 'Internal server error' })
        }
    },
};

module.exports = UserController;
