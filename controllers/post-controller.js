const { prisma } = require('../prisma/prisma-client');

const PostController = {
    createPost: async (req, res) => {
        const { content } = req.body;
        const authorId = req.user.userId;

        if (!content) {
            return res.status(400).json({ error: 'Все поля обязательны' })
        }

        try {
            const post = await prisma.post.create({ //создается пост
                data: {
                    content,
                    authorId,
                }
            })

            res.json(post);
        } catch (error) {
            console.error('Create post error')

            res.status(500).json({ error: 'Internal server error' })
        }
    },
    getAllPosts: async (req, res) => {
        const userId = req.user.userId;

        try {
            const posts = await prisma.post.findMany({ //найти все совпадения.
                include: { //включает лайки, автора, комменты
                    likes: true,
                    author: true,
                    comments: true,
                },
                orderBy: { //отсортировать по убыванию (в нашем случае - по убыванию создания, т.е новые посты сверху)
                    createdAt: 'desc'
                }
            });

            const postWithLikeInfo = posts.map(post => ({ //по всем постам что мы получили мы проходимся циклом
                ...post, //вернём все что пришло посту
                likedByUser: post.likes.some(like => like.userId === userId) //по всем лайкам найдём лайк принадлежащий юзеру
            }));

            res.json(postWithLikeInfo);
        } catch (error) {
            console.error('Get all posts error')

            res.status(500).json({ error: 'Internal server error' })
        }
    },
    getPostById: async (req, res) => {
        const { id } = req.params; //id поста
        const userId = req.user.userId;

        try {
            const post = await prisma.post.findUnique({
                where: { id }, //найти по этому id
                include: { //и еще подключи туда комментарии, лайки, автора
                    comments: {
                        include: { //включая создателя комментария
                            user: true,
                        }
                    },
                    likes: true,
                    author: true,
                }
            })

            if (!post) {
                res.status(404).json({ error: 'Post not found' });
            }

            const postWIthLikeInfo = {
                ...post,
                likedByUser: post.likes.some(like => like.userId === userId),
            }

            res.json(postWIthLikeInfo);
        } catch (error) {
            console.error('Get post by Id error');

            res.status(500).json({ error: 'Internal server error' });
        }
    },
    deletePost: async (req, res) => {
        const { id } = req.params; //id поста

        const post = await prisma.post.findUnique({ where: { id } });

        if (!post) {
            res.status(404).json({ error: 'Post not found' });
        }

        if (post.authorId !== req.user.userId) {
            return res.status(403).json({ error: 'No access' });
        }

        try {
            const transaction = await prisma.$transaction([ //удаление из нескольких баз данных - transaction. Принимает массив обычных операций
                prisma.comment.deleteMany({ where: { postId: id } }),
                prisma.like.deleteMany({ where: { postId: id } }),
                prisma.post.delete({ where: { id } }),
            ])

            res.json(transaction);
        } catch (error) {
            console.error('Delete post error');

            res.status(500).json({ error: 'Internal server error' });
        }
    },
}

module.exports = PostController;