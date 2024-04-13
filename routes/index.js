//Выносим контроллеры в отдельный файл

const express = require('express'); //пакет создания роутов
const router = express.Router();
const multer = require('multer'); //пакет загрузки картинок
const {
    UserController,
    PostController,
    CommentController,
    LikeController,
    FollowController,
} = require("../controllers");

const authenticateToken = require("../middleware/auth")

const uploadDestination = "uploads"; //путь

//Показываем где хранить файлы
const storage = multer.diskStorage({
    destination: uploadDestination,
    filename: function (req, file, cb) { //наши запросы имени будут проходить через функцию
        cb(null, file.originalname)
    }, //https://youtu.be/GOZrjIpRtkI?si=89zQnuXMAkDT50hI&t=2074 почему название важно
})

const uploads = multer({ storage: storage }) //создаем хранилище, конфигурация выше

//Роуты пользователя
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.get('/current', authenticateToken, UserController.current); //сначала проверяется authenticateToken, затем уже контроллер
router.get('/users/:id', authenticateToken, UserController.getUserById); //:id - здесь будет записываться число, которое в запросе
router.put('/users/:id', authenticateToken, uploads.single('avatar'), UserController.updateUser); //uploads.single следит за полем которое нужно обновить

//Роуты постов
router.post('/posts', authenticateToken, PostController.createPost);
router.get('/posts', authenticateToken, PostController.getAllPosts);
router.get('/posts/:id', authenticateToken, PostController.getPostById);
router.delete('/posts/:id', authenticateToken, PostController.deletePost);

//Роуты комментариев
router.post('/comments', authenticateToken, CommentController.createComment);
router.delete('/comments/:id', authenticateToken, CommentController.deleteComment);

//Роуты лайков
router.post('/likes', authenticateToken, LikeController.likePost);
router.delete('/likes/:id', authenticateToken, LikeController.unlikePost);

//Роуты подписок
router.post('/follows', authenticateToken, FollowController.followUser);
router.delete('/follows/:id', authenticateToken, FollowController.unfollowUser);

module.exports = router;