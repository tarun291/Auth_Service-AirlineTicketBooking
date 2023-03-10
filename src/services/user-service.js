const jwt = require('jsonwebtoken');

const bcrypt = require('bcrypt');

const UserRepository = require('../repository/user-repository');

const { JWT_KEY } = require('../config/serverConfig');
const { use } = require('../routes');

class UserService {
    constructor() {
        this.userRepository = new UserRepository();
    }
    async create(data) {
        try {
            const user = await this.userRepository.create(data);
            return user;
        } catch (error) {
            if(error.name=='SequelizeValidationError'){
                throw error
            }
            console.log("Something went wrong in service layer");
            throw error;
        }
    }
    createToken(user) {
        try {
            const result = jwt.sign(user, JWT_KEY, { expiresIn: "1h" });
            return result;
        } catch (error) {
            console.log("Something went wrong in token creation");
            throw error;
        }
    }

    async signIn(email, plainPassword) {
        try {
            // step 1 --> fetch the user using the email
            const user = await this.userRepository.getByEmail(email);
            // step 2 --> compare incoming plain password with stores encrypted password
            const passwordMatch = this.checkPassword(plainPassword, user.password);
            if (!passwordMatch) {
                console.log("Password doesn't match");
                throw { error: "Incorrect password" };
            }

            // step 3 --> if password match then create a token and send it to the user
            const newJWT = this.createToken({ email: user.email, id: user.id });
            return newJWT;
        } catch (error) {
            console.log("Something went wrong int the sigin process");
            throw error;
        }
    }

    veryfyToken(token) {
        try {
            const response = jwt.verify(token, JWT_KEY);
            return response;
        } catch (error) {
            console.log("Something went wrong in token validation", error);
            throw error;
        }
    }
    checkPassword(userInputPlainPassword, encryptedPassword) {
        try {
            return bcrypt.compareSync(userInputPlainPassword, encryptedPassword);
        } catch (error) {
            console.log("Something went wrong in passwrod Comparison");
            throw error;
        }
    }
    async isAuthenticated(token){
        try {
            // console.log(token);
            const response=this.veryfyToken(token);
            if(!response){
                throw {error:"Invalid token"};
            }
            const user=this.userRepository.getById(response.id);
            if(!user){
                throw {error:"No user with the corresponding token exists"};
            }
            return user.id;
        } catch (error) {
            console.log("Something went wrong in passwrod Comparison");
            throw error;
        }
    }
    isAdmin(userId){
        try {
            return this.userRepository.isAdmin(userId);
        } catch (error) {
            console.log("Something went wrong in Service layer");
            throw error;
        }
    }
    isCustomer(userId){
        try {
            return this.userRepository.isCustomer(userId);
        } catch (error) {
            console.log("Something went wrong in Service layer");
            throw error;
        }
    }
}
module.exports = UserService;