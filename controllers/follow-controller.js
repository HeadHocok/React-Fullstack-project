const { prisma } = require('../prisma/prisma-client');

const FollowController = {
    followUser: async (req, res) => {
        const { followingId } = req.body;
        const userId = req.user.userId;

        if (followingId === userId) {
            res.status(500).json({ error: 'Нельзя подписаться на себя' })
        }

        try {
            const existingFollow = await prisma.follows.findFirst({
                where: { //проверяем что подписчик - пользователь И что пользователь подписан на followingId.
                    AND: [
                        { followerId: userId },
                        { followingId },
                    ]
                }
            })

            if (existingFollow) {
                return res.status(400).json({ error: 'Подписка уже существует' })
            }

            await prisma.follows.create({
                data: {
                    follower: { connect: { id: userId } },
                    following: { connect: { id: followingId } },
                }
            })

            res.status(201).json({ message: 'Подписка успешно создана' })
        } catch (error) {
            console.error('Following error', error)

            res.status(500).json({ error: 'Internal server error' })
        }
    },
    unfollowUser: async (req, res) => {
        const { followingId } = req.body;
        const userId = req.user.userId;

        try {
            const follows = await prisma.follows.findFirst({
                where: { //проверяем что подписчик - пользователь И что пользователь подписан на followingId.
                    AND: [
                        {followerId: userId},
                        {followingId}
                    ]
                }
            })

            if (!follows) {
                return res.status(404).json({ error: 'Подписка не была оформлена ранее' })
            }

            await prisma.follows.delete({
                where: { id: follows.id },
            })

            res.status(201).json({ message: 'Подписка успешно удалена' })
        } catch (error) {
            console.error('Unfollowing error', error)

            res.status(500).json({ error: 'Internal server error' })
        }
    }
}

module.exports = FollowController;