//экспортируем все контроллеры
const UserController = require('./user-controller');
const PostController = require('./post-controller');
const CommentController = require('./comment-contoller');
const LikeController = require('./like-controller');
const FollowController = require('./follow-controller');

module.exports = { //для обращения к ./user-controller, экспортируем более короткую запись
    UserController,
    PostController,
    CommentController,
    LikeController,
    FollowController,
}