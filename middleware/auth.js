const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    const token = authHeader?.split(' ')[1]; //если был токен - берём

    if (!token) {
        return res.status(401).json({ error: "Unauthorized" })
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => { //пробуем дешифровать
        if (err) {
            return res.status(403).json({ error: "Invalid Token" } )
        }

        req.user = user; //все получилось, передаем пользователя.

        next();
    })
};

module.exports = authenticateToken;