import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
dotenv.config()

import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import PostModel from '../models/Post.js'
import UserModel from '../models/User.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const getLastTags = async (req, res) => {
	try {
		const posts = await PostModel.find().limit(5).exec()

		const tags = posts
			.map(obj => obj.tags)
			.flat()
			.slice(0, 5)

		res.json(tags)
	} catch (err) {
		console.log(err)
		res.status(500).json({
			message: 'Не удалось получить тэги',
		})
	}
}

export const getAll = async (req, res) => {
	try {
		const posts = await PostModel.find().populate('').exec()
		res.json(posts)
	} catch (err) {
		console.log(err)
		res.status(500).json({
			message: 'Makaleler alınamadı',
		})
	}
}

export const getOne = async (req, res) => {
	try {
		const postId = req.params.id

		PostModel.findOneAndUpdate(
			{
				_id: postId,
			},
			{
				$inc: { viewsCount: 1 },
			},
			{
				returnDocument: 'after',
			},
			(err, doc) => {
				if (err) {
					console.log(err)
					return res.status(500).json({
						message: 'Не удалось вернуть статью',
					})
				}

				if (!doc) {
					return res.status(404).json({
						message: 'Makale bulunamadı',
					})
				}

				res.json(doc)
			}
		).populate('user')
	} catch (err) {
		console.log(err)
		res.status(500).json({
			message: 'Makaleler alınamadı',
		})
	}
}

export const remove = async (req, res) => {
	try {
		const postId = req.params.id

		const post = await PostModel.findById(postId) // Находим пост по ID

		if (!post) {
			return res.status(404).json({
				message: 'Makale bulunamadı',
			})
		}

		// Предполагаем, что post.images содержит массив путей к файлам
		if (post.image && post.image.length) {
			post.image.forEach(imagePath => {
				const filename = imagePath.replace('/uploads/', '')
				const fullImagePath = path.join(__dirname, '..', 'uploads', filename)

				fs.unlink(fullImagePath, err => {
					if (err) {
						console.error(`Ошибка при удалении изображения ${filename}:`, err)
						// Не отправляем ответ здесь, так как это может прервать дальнейшую обработку
					} else {
						console.log(`Изображение ${filename} было успешно удалено`)
					}
				})
			})
		}

		// Удаление самого поста
		await PostModel.findByIdAndDelete(postId)

		res.json({
			success: true,
		})
	} catch (err) {
		console.log(err)
		res.status(500).json({
			message: 'Не удалось удалить статью',
		})
	}
}

export const create = async (req, res) => {
	try {
		const doc = new PostModel({
			image: req.body.image,
			description: req.body.description,
			price: req.body.price,
			storage: req.body.storage,
			memory: req.body.memory,
			processor: req.body.processor,
			model: req.body.model,
			brand: req.body.brand,
			grade: req.body.grade,
			tel: req.body.tel,
			category: req.body.category,
			user: req.userId,
		})

		const post = await doc.save()
		const cardId = post._id

		sendMerchantEmail(cardId)

		res.json(post)
	} catch (err) {
		console.log(err)
		res.status(500).json({
			message: 'Makale oluşturma başarısız oldu',
		})
	}
}

const sendMerchantEmail = async cardId => {
	// create a transporter to send the email
	try {
		let transporter = nodemailer.createTransport({
			host: 'smtp.mail.ru', // replace with your smtp host
			port: 465, // replace with your smtp port
			secure: true, // true for 465, false for other ports
			auth: {
				user: process.env.SMTP_USER, // replace with your email
				pass: process.env.SMTP_PASSWORD, // replace with your password
			},
		})

		// set up the email options
		let mailOptions = {
			from: '"PC auction" <pcauction@mail.ru>',
			to: process.env.SMTP_BAER,
			subject: 'Yeni teklifi değerlendirin',
			html: `<p>Merhaba Alıcı,</p>
            <p>Yeni bir teklif aldınız, lütfen onu en adil şekilde değerlendirin ve satıcı sizi seçecektir:</p>
            <p>Tüm ilanların olduğu sayfaya gitmek için bu <a href="https://pcref.site/lastrequests">BAĞLANTIYA</a> tıklayın, </p>
            <p> Ürün kartını bulmak için bu ID'yi girin ID ${cardId} </p>
            
            `,
		}

		// send the email
		await transporter.sendMail(mailOptions)
	} catch (error) {
		console.log(error)
	}
}

export const update = async (req, res) => {
	try {
		const seller = await UserModel.findOne({ _id: req.body.user })

		sendSellerPriceEmail(seller, req)

		const post = await PostModel.findOne({ _id: req.params.id })

		const postId = req.params.id
		if (parseInt(post.grade) < parseInt(req.body.grade)) {
			await PostModel.updateOne(
				{
					_id: postId,
				},
				{
					grade: req.body.grade,
				}
			)
			console.log('price update')

			res.json({
				success: true,
			})
		} else {
			res.json({
				success: false,
			})
		}
	} catch (err) {
		console.log(err)
		res.status(500).json({
			message: 'Makale güncellenemedi',
		})
	}
}

const sendSellerPriceEmail = async (user, req) => {
	// create a transporter to send the email
	try {
		let transporter = nodemailer.createTransport({
			host: 'smtp.mail.ru', // replace with your smtp host
			port: 465, // replace with your smtp port
			secure: true, // true for 465, false for other ports
			auth: {
				user: process.env.SMTP_USER, // replace with your email
				pass: process.env.SMTP_PASSWORD, // replace with your password
			},
		})

		// set up the email options
		let mailOptions = {
			from: '"PC auction" <pcauction@mail.ru',
			to: user.email,
			subject: `Size ${req.body.grade} TL teklif ediyorlar.`,
			html: `<p>Hello ${user.fullName},</p>
      <p>Alıcı ürününüzü ${req.body.grade} TL olarak değerlendirdi.  </p>
      <p>Bu onun telefon numarası  ${req.body.tel} </p>
            <p>Bu, WhatsApp linki  https://wa.me/${req.body.tel} </p>            
            <p> Acele etmeyin ve birkaç teklif daha beklemenizi öneririz.  </p>            
            <p> Ürünün ID'si ${req.body._id} </p>            
            `,
		}

		// send the email
		await transporter.sendMail(mailOptions)
	} catch (error) {
		console.log(error)
	}
}
