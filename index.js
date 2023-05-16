import express from 'express';
import fs from 'fs';
import multer from 'multer';
import cors from 'cors';
import UserModel from './models/User.js';
import sharp from 'sharp';
import dotenv from 'dotenv';
dotenv.config();




mongoose.set('strictQuery', true);
import mongoose from 'mongoose';

import { registerValidation, loginValidation, postCreateValidation } from './validations.js';

import { handleValidationErrors, checkAuth } from './utils/index.js';

import { UserController, PostController, AccessoriesController, MonitorsController, LaptopsController } from './controllers/index.js';


mongoose
  // .connect(process.env.MONGODB_URI)
  .connect(process.env.DB_URL)
  .then(() => console.log('DB ok'))
  .catch((err) => console.log('DB error', err));

const app = express();

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    if (!fs.existsSync('upload')) {
      fs.mkdirSync('upload');
    }
    cb(null, 'upload');

  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);

  },
});


const upload = multer({ storage });

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

app.post('/auth/login', loginValidation, handleValidationErrors, UserController.login);
app.post('/auth/register', registerValidation, handleValidationErrors, UserController.register);

app.patch('/auth/resetpass', /* registerValidation, handleValidationErrors, */ UserController.resetpass);
app.get('/auth/me', checkAuth, UserController.getMe);

app.post('/upload', /* checkAuth, */ upload.array('image', 12), async (req, res) => {
  try {
    const promises = req.files.map(async (file) => {
      return sharp(`./upload/${file.originalname}`)
        .resize(800, 1000)
        .jpeg({ quality: 70 })
        .rotate()
        .toFile(`./uploads/${file.originalname}`);
    });

    await Promise.all(promises);
    res.json({
      url: req.files.map((file) => `/uploads/${file.originalname}`),
    });

    fs.readdir('./upload', (err, files) => {
      if (err) {
        console.error(err);
        return;
      }

      // Удаляем каждый файл
      for (const file of files) {
        fs.unlink(`./upload/${file}`, (err) => {
          if (err) {
            console.error(err);
            return;
          }
        });
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing files');

  }
  console.log(req.files[0].originalname);

});

app.get('/activate/:token', async (req, res) => {
  try {
    const token = req.params.token;

    // Find the user with the matching token
    const user = await UserModel.findOne({ activationToken: token });
    if (!user) {
      return res.status(404).json({ message: 'Invalid token' });
    }
    // Update the user's isActivated field
    user.isActivated = true;
    await user.save();
    // Redirect the user to the account activation success page
    res.redirect('https://pcref.site/activation-success');
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error activating account' });
  }
});


app.get('/tags', PostController.getLastTags);

app.get('/posts', PostController.getAll);
app.get('/accessories', AccessoriesController.getAll);
app.get('/monitors', MonitorsController.getAll);
app.get('/laptops', LaptopsController.getAll);
app.get('/posts/tags', PostController.getLastTags);
app.get('/posts/:id', PostController.getOne);
app.post('/posts', checkAuth, /* postCreateValidation, */ /* handleValidationErrors, */ PostController.create);
app.post('/accessories', checkAuth, /* postCreateValidation, */ /* handleValidationErrors, */ AccessoriesController.create);
app.post('/monitors', checkAuth, /* postCreateValidation, */ /* handleValidationErrors, */ MonitorsController.create);
app.post('/laptops', checkAuth, /* postCreateValidation, */ /* handleValidationErrors, */ LaptopsController.create);
app.delete('/posts/:id', checkAuth, PostController.remove);
app.delete('/accessories/:id', checkAuth, AccessoriesController.remove);
app.delete('/monitors/:id', checkAuth, MonitorsController.remove);
app.patch('/monitors/:id', checkAuth,/* postCreateValidation, *//* handleValidationErrors, */MonitorsController.update);
app.patch('/accessories/:id', checkAuth,/* postCreateValidation, *//* handleValidationErrors, */AccessoriesController.update);
app.delete('/laptops/:id', checkAuth, LaptopsController.remove);
app.patch('/laptops/:id', checkAuth,/* postCreateValidation, *//* handleValidationErrors, */LaptopsController.update);
app.patch('/posts/:id', checkAuth,/* postCreateValidation, *//* handleValidationErrors, */PostController.update);

const PORT = process.env.PORT || 4444;

app.listen(process.env.PORT || 4444, (err) => {
  if (err) {
    return console.log(err);
  }

  console.log('Server OK', PORT);
  // console.log('Server OK');
});
