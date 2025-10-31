import Admin from "../models/Admin.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";



export const register = async (req, res) => {
  try {
    // get the data from the req body
    const { email, password, name } = req.body;
    // validate the input
    if (!email || !password || !name) {
      return res.status(400).json({
        message: "Email, Password, Name is required!",
      });
    }
    // hash the password
    if (typeof password !== "string" && !password.length >= 8) {
      return res.status(400).json({
        message: "Password should be 8 character long!",
      });
    }
    const hashPassword = await bcrypt.hash(password, 10);

    // check if there is existing user
    const existingUser = await Admin.findOne({
      email: email,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "user already exists!",
      });
    }
    // store the data in DB
    const user = await Admin.create({
      email,
      passwordHash: hashPassword,
      name,
    });
    // generate the JSON web token
    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    // return the JSON web token and users details
    return res.status(201).json({
      message: "Registered successfully!",
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          token,
        },
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Something went wrong!",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  console.log(req.body)
  try {
    // check the user input
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(401).json({
        message: "Emails and Password are required!",
        data: null,
      });
    }
    // Find the user in DB
    const user = await Admin.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid Crendtials",
        data: null,
      });
    }
    // comapre the hashpassword
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid Crendtials",
        data: null,
      });
    }

    // Create and sign the JWT token

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    // return the token and user details
    return res.status(200).json({
      message: "Logged In succesfully!",
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
        JSONWebToken: {
          token,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong!",
      data: error.message,
    });
  }
};
