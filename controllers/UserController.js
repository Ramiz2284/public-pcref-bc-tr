import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'

import UserModel from '../models/User.js'

export const register = async (req, res) => {
	try {
		const password = req.body.password
		const salt = await bcrypt.genSalt(10)
		const hash = await bcrypt.hash(password, salt)

		// generate a unique activation token
		const activationToken =
			Math.random().toString(36).substring(2, 15) +
			Math.random().toString(36).substring(2, 15)

		const doc = new UserModel({
			email: req.body.email,
			fullName: req.body.fullName,
			avatarUrl: req.body.avatarUrl,
			passwordHash: hash,
			activationToken: activationToken,
			isActivated: false,
		})

		const user = await doc.save()

		const token = jwt.sign(
			{
				_id: user._id,
			},
			'secret123',
			{
				expiresIn: '30d',
			}
		)

		const { passwordHash, ...userData } = user._doc

		sendActivationEmail(userData, activationToken)

		res.json({
			...userData,
			token,
			message:
				'A activation email has been sent to your email, please follow the link to activate your account.',
		})
	} catch (err) {
		console.log(err)
		res.status(500).json({
			message: 'Kayıt olunamadı',
		})
	}
}

const sendActivationEmail = async (user, token) => {
	// create a transporter to send the email
	try {
		let transporter = nodemailer.createTransport({
			host: 'smtp.mail.ru', // replace with your smtp host
			port: 465, // replace with your smtp port
			secure: true, // true for 465, false for other ports
			auth: {
				user: 'pcauction@mail.ru', // replace with your email
				pass: 'k2UaLapHbXb2Bfz4UXAh', // replace with your password
			},
		})

		// set up the email options
		let mailOptions = {
			from: '"PC Auction" <pcauction@mail.ru>',
			to: user.email,
			subject: 'Activate your account',
			html: `<p>Merhaba, ${user.fullName}</p>
      <p>PC auction uygulamasına kayıt olduğunuz için teşekkür ederiz. Lütfen hesabınızı etkinleştirmek için aşağıdaki linke tıklayın:</p>
      <a href="https://pcref.site:9000/activate/${token}">Hesabınızı Aktifleştirin</a>
      <p>Eğer bu aktivasyonu talep etmediyseniz, lütfen bu e-postayı görmezden gelin.</p>
      <p>Teşekkürler,</p>
      <p>PC auction Ekibi</p>`,
		}

		// send the email
		await transporter.sendMail(mailOptions)
	} catch (error) {
		console.log(error)
	}
}

export const login = async (req, res) => {
	try {
		const user = await UserModel.findOne({ email: req.body.email })

		if (!user) {
			return res.status(404).json({
				message: 'Kullanıcı bulunamadı',
			})
		}

		const isValidPass = await bcrypt.compare(
			req.body.password,
			user._doc.passwordHash
		)

		if (!isValidPass) {
			return res.status(400).json({
				message: 'Yanlış kullanıcı adı veya şifre',
			})
		}

		const token = jwt.sign(
			{
				_id: user._id,
			},
			'secret123',
			{
				expiresIn: '30d',
			}
		)

		const { passwordHash, ...userData } = user._doc

		res.json({
			...userData,
			token,
		})
	} catch (err) {
		console.log(err)
		res.status(500).json({
			message: 'Giriş yapılamadı',
		})
	}
}

export const getMe = async (req, res) => {
	try {
		const user = await UserModel.findById(req.userId)
		if (!user) {
			return res.status(404).json({
				message: 'Kullanıcı bulunamadı',
			})
		}

		const { passwordHash, ...userData } = user._doc

		res.json(userData)
	} catch (err) {
		console.log(err)
		res.status(500).json({
			message: 'Нет доступа',
		})
	}
}

export const resetpass = async (req, res) => {
	const password = req.body.password
	const salt = await bcrypt.genSalt(10)
	const hash = await bcrypt.hash(password, salt)
	try {
		const user = await UserModel.findOne({ email: req.body.email })
		if (!user) {
			return res.status(500).json({ message: 'Şifre sıfırlanamadı' })
		}
		await UserModel.updateOne(
			{
				email: req.body.email,
			},
			{
				passwordHash: hash,
			}
		)
		res.status(200).json({ message: 'Şifre başarıyla değiştirildi' })
	} catch (err) {
		console.log(err)
		res.status(500).json({
			message: 'Şifre sıfırlanamadı',
		})
	}
}
