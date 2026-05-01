import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendFeedbackEmail = async (
  customerEmail: string,
  orderId: string,
  customerName: string
) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("Email credentials are not set in .env");
    return;
  }

  const feedbackLink = `https://elemenopee.vercel.app/product-details/${orderId}`; // Adjust as needed
  
  const mailOptions = {
    from: `"Elemenopee" <${process.env.EMAIL_USER}>`,
    to: customerEmail,
    subject: "We'd love your feedback on your recent purchase!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #FF388E; text-align: center;">Hi ${customerName}!</h2>
        <p>Your order <strong>#${orderId.slice(-6).toUpperCase()}</strong> has been delivered. We hope you and your little ones love it!</p>
        <p>Could you take a moment to share your thoughts? Your feedback helps us improve and helps other parents make better choices.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${feedbackLink}" style="background-color: #FF388E; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; rounded: 5px;">Leave a Review</a>
        </div>
        <p>If you have any questions, feel free to reply to this email.</p>
        <p>Best regards,<br>The Elemenopee Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Feedback email sent: " + info.response);
  } catch (error) {
    console.error("Error sending feedback email:", error);
  }
};
