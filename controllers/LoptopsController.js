import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import LaptopsModel from '../models/Laptops.js'
dotenv.config()

import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import UserModel from '../models/User.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const getAll = async (req, res) => {
	try {
		const laptops = await LaptopsModel.find().populate('').exec()
		res.json(laptops)
	} catch (err) {
		console.log(err)
		res.status(500).json({
			message: 'Makaleler alınamadı',
		})
	}
}

export const remove = async (req, res) => {
	try {
		const laptopsId = req.params.id

		const laptops = await LaptopsModel.findById(laptopsId) // Находим пост по ID

		if (!laptops) {
			return res.status(404).json({
				message: 'Makale bulunamadı',
			})
		}

		if (laptops.image && laptops.image.length) {
			laptops.image.forEach(imagePath => {
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

		LaptopsModel.findOneAndDelete(
			{
				_id: laptopsId,
			},
			(err, doc) => {
				if (err) {
					console.log(err)
					return res.status(500).json({
						message: 'Makaleyi silme başarısız oldu',
					})
				}

				if (!doc) {
					return res.status(404).json({
						message: 'Makale bulunamadı',
					})
				}

				res.json({
					success: true,
				})
			}
		)
	} catch (err) {
		console.log(err)
		res.status(500).json({
			message: 'Makaleler alınamadı',
		})
	}
}

export const create = async (req, res) => {
	try {
		const doc = new LaptopsModel({
			model: req.body.model,
			size: req.body.size,
			processor: req.body.processor,
			ram: req.body.ram,
			storage: req.body.storage,
			price: req.body.price,
			description: req.body.description,
			grade: req.body.grade,
			tel: req.body.tel,
			category: req.body.category,
			image: req.body.image,
			user: req.userId,
		})

		const laptops = await doc.save()
		const cardId = laptops._id
		sendMerchantEmail(cardId)

		res.json(laptops)
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
			from: '"PC auction" <pcauction@mail.ru>>',
			to: process.env.SMTP_BAER,
			subject: 'Yeni teklifi değerlendirin',
			html: `<p>Merhaba Alıcı,</p>
            <p>Yeni bir teklif aldınız, lütfen onu en adil şekilde değerlendirin ve satıcı sizi seçecektir:</p>
            <p>Tüm ilanların olduğu sayfaya gitmek için bu <a href="https://pcref.site/lastrequestslaptop">BAĞLANTIYA</a> tıklayın, </p>
            <p> Ürün kartını bulmak için bu ID'yi girin
						 ID ${cardId} </p>
            
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

		const laptops = await LaptopsModel.findOne({ _id: req.params.id })

		const postId = req.params.id
		if (parseInt(laptops.grade) < parseInt(req.body.grade)) {
			await LaptopsModel.updateOne(
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
			from: '"PC auction" <pcauction@mail.ru>',
			to: user.email,
			subject: `Size ${req.body.grade} TL teklif ediyorlar.`,
			html: `<p>Hello ${user.fullName},</p>
      <p>Alıcı ürününüzü ${req.body.grade} TL olarak değerlendirdi.  </p>
      <p>Bu onun telefon numarası${req.body.tel} </p>
            <p>Bu, WhatsApp linki https://wa.me/${req.body.tel} </p>            
            <p> Acele etmeyin ve birkaç teklif daha beklemenizi öneririz.  </p>            
            <p> Ürünün ID'si  ${req.body._id} </p>            
            `,
		}

		// send the email
		await transporter.sendMail(mailOptions)
	} catch (error) {
		console.log(error)
	}
}
