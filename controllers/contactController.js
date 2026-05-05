const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.submitContactForm = async (req, res) => {
    try {
        const { fullName, email, subject, message, inquiryType } = req.body;

        // 1. Validation
        if (!fullName || !email || !subject || !message || !inquiryType) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required.' 
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email format.' 
            });
        }

        // 2. Construct Email HTML
        const htmlContent = `
            <h2>New Inquiry: ${inquiryType}</h2>
            <p><strong>From:</strong> ${fullName} (${email})</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr />
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
        `;

        // Prepare attachments array
        const attachments = [];
        if (req.file) {
            attachments.push({
                filename: req.file.originalname,
                content: req.file.buffer
            });
        }

        // 3. Send Email via Resend
        const data = await resend.emails.send({
            from: process.env.RESEND_FROM || 'Bio Spectra <onboarding@resend.dev>',
            to: process.env.ADMIN_EMAIL,
            replyTo: email,
            subject: `[Bio Spectra Contact] ${subject}`,
            html: htmlContent,
            attachments: attachments.length > 0 ? attachments : undefined,
        });

        if (data.error) {
            console.error('Resend API Error:', data.error);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to send message. Please try again later.',
                error: data.error 
            });
        }

        // 4. Success Response
        return res.status(200).json({ 
            success: true, 
            message: 'Your message has been sent successfully.',
            id: data.data.id
        });

    } catch (error) {
        console.error('Contact Form Server Error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error.' 
        });
    }
};
