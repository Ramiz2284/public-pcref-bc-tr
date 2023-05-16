import nodemailer from 'nodemailer'

import AccessoriesModel from '../models/Accessories.js'
import UserModel from '../models/User.js'

import dotenv from 'dotenv'
dotenv.config()

export const getAll = async (req, res) => {
	try {
		const accessories = await AccessoriesModel.find().populate('').exec()
		res.json(accessories)
	} catch (err) {
		console.log(err)
		res.status(500).json({
			message: 'Makaleler alınamadı',
		})
	}
}

export const remove = async (req, res) => {
	try {
		const accessoriesId = req.params.id

		AccessoriesModel.findOneAndDelete(
			{
				_id: accessoriesId,
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
		const doc = new AccessoriesModel({
			video: req.body.video,
			motherboard: req.body.motherboard,
			processor: req.body.processor,
			memory: req.body.memory,
			storage: req.body.storage,
			price: req.body.price,
			power: req.body.power,
			case: req.body.case,
			description: req.body.description,
			image: req.body.image,
			grade: req.body.grade,
			tel: req.body.tel,
			category: req.body.category,
			user: req.userId,
		})

		const accessories = await doc.save()
		const cardId = accessories._id
		sendMerchantEmail(cardId)

		res.json(accessories)
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
			from: '"PC Auction" <pcauction@mail.ru>',
			to: process.env.SMTP_BAER,
			subject: 'Yeni teklifi değerlendirin',
			html: `<p>Merhaba Alıcı,</p>
      <p>Yeni bir teklif aldınız, lütfen onu en adil şekilde değerlendirin ve satıcı sizi seçecektir:</p>
      <p>Tüm ilanların olduğu sayfaya gitmek için bu <a href="https://pcref.site/lastrequestsacess">BAĞLANTIYA</a> tıklayın:</p>
      <p> Ürün kartını bulmak için bu ID'yi girin ${cardId} </p>
            
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

		const accessories = await AccessoriesModel.findOne({ _id: req.params.id })

		const postId = req.params.id
		if (parseInt(accessories.grade) < parseInt(req.body.grade)) {
			await AccessoriesModel.updateOne(
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
			from: '"PC Auction" <pcauction@mail.ru>',
			to: user.email,
			subject: `Size ${req.body.grade} TL teklif ediyorlar., html: <p>Hello ${user.fullName},</p>
      <p>Alıcı ürününüzü ${req.body.grade} TL olarak değerlendirdi. </p>
      <p>Bu onun telefon numarası ${req.body.tel} </p>
      <p>Bu, WhatsApp linki https://wa.me/${req.body.tel} </p>
      <p> Acele etmeyin ve birkaç teklif daha beklemenizi öneririz. </p>
      <p> Ürünün ID'si ${req.body._id} </p>           
            `,
		}

		// send the email
		await transporter.sendMail(mailOptions)
	} catch (error) {
		console.log(error)
	}
}
