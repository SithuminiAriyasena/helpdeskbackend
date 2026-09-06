const nodemailer = require('nodemailer')
require('dotenv').config()

async function sendReplyEmail({ to, ticketId, subject, body }) {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM || `Support <${smtpUser}>`

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('SMTP configuration is incomplete')
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #111;">
      <h2>Update on ticket ${ticketId}</h2>
      <p>${body.replace(/\n/g, '<br/>')}</p>
      <hr/>
      <p>Regards,<br/>Support Team</p>
    </div>
  `

  const info = await transporter.sendMail({
    from,
    to,
    subject: subject || `Update for ticket ${ticketId}`,
    html,
  })

  return info
}

exports.reply = async (req, res) => {
  try {
    const { email, ticketId, description } = req.body
    if (!email || !description) {
      return res.status(400).json({ message: 'Email and description are required' })
    }

    await sendReplyEmail({ to: email, ticketId, body: description })

    return res.json({ message: 'Email sent' })
  } catch (err) {
    console.error('Failed to send reply email', err)
    return res.status(500).json({ message: 'Failed to send email', error: err.message })
  }
}

exports.sendReplyEmail = sendReplyEmail
