const bcrypt = require("bcryptjs");

const comparePassword = async (enteredPassword, hashedPassword) => {
    return bcrypt.compare(enteredPassword, hashedPassword);
};

module.exports = comparePassword;