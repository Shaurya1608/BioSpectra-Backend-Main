const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Sanitize user input to prevent XSS in emails
const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

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

        // 2. Construct Email HTML (sanitized)
        const htmlContent = `
            <h2>New Inquiry: ${escapeHtml(inquiryType)}</h2>
            <p><strong>From:</strong> ${escapeHtml(fullName)} (${escapeHtml(email)})</p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
            <hr />
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
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
