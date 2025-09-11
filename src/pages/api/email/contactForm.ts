import { Resend } from 'resend';
import type { APIRoute } from 'astro';
import { createServerClient } from '@supabase/ssr';

// Secure environment variable access
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

const resend = new Resend(RESEND_API_KEY);

// reCAPTCHA verification function
async function verifyRecaptcha(token: string): Promise<{ success: boolean; score?: number }> {
  const RECAPTCHA_SECRET_KEY = import.meta.env.RECAPTCHA_SECRET_KEY;
  
  if (!RECAPTCHA_SECRET_KEY) {
    console.error('RECAPTCHA_SECRET_KEY environment variable is required');
    return { success: false };
  }

  if (!token) {
    return { success: false };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const result = await response.json();
    return {
      success: result.success && (result.score ? result.score > 0.5 : true),
      score: result.score,
    };
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    return { success: false };
  }
}

// HTML sanitization function to prevent XSS
function sanitizeHtml(text: string): string {
  if (typeof text !== 'string') return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Generate ULID-style ticket ID
function generateTicketId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `SFH-${timestamp}-${random}`.toUpperCase();
}

// Route submissions based on intent type
function getRoutingInfo(intentType: string) {
  const routes = {
    press: {
      email: 'press@singforhope.org',
      priority: 'high',
      template: 'press-inquiry'
    },
    volunteer: {
      email: 'volunteer@singforhope.org', 
      priority: 'medium',
      template: 'volunteer-inquiry'
    },
    donor: {
      email: 'donations@singforhope.org',
      priority: 'high', 
      template: 'donor-inquiry'
    },
    general: {
      email: 'hello@singforhope.org',
      priority: 'medium',
      template: 'general-inquiry'
    }
  };
  
  return routes[intentType as keyof typeof routes] || routes.general;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phoneNumber, 
      organization,
      intentType,
      message,
      consentGiven,
      recaptchaToken
    } = await request.json();

    // Basic validation
    if (!firstName || !lastName || !email || !message || !intentType) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify consent for GDPR compliance
    if (!consentGiven) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Consent is required to process your inquiry' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify reCAPTCHA
    const recaptchaResult = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Security verification failed. Please try again.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate ticket ID
    const ticketId = generateTicketId();
    
    // Get routing information
    const routing = getRoutingInfo(intentType);
    
    // Secure Supabase client creation
    const SUPABASE_URL = import.meta.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
    }

    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          get(key) {
            return cookies.get(key)?.value;
          },
          set(key, value, options) {
            cookies.set(key, value, options);
          },
          remove(key, options) {
            cookies.delete(key, options);
          },
        },
      }
    );

    // Store submission in database
    const submissionData = {
      ticket_id: ticketId,
      intent_type: intentType,
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone_number: phoneNumber || null,
      organization: organization || null,
      message: message,
      consent_given: consentGiven,
      status: 'pending',
      priority: routing.priority,
      routing_email: routing.email
    };

    const { error: dbError } = await supabase
      .from('contact_submissions')
      .insert([submissionData]);

    if (dbError) {
      console.error('Database error:', dbError);
      // Continue with email even if DB fails
    }

    // Prepare email content based on intent type (with sanitization)
    const safeFirstName = sanitizeHtml(firstName);
    const safeLastName = sanitizeHtml(lastName);
    const safeEmail = sanitizeHtml(email);
    const safePhoneNumber = phoneNumber ? sanitizeHtml(phoneNumber) : '';
    const safeOrganization = organization ? sanitizeHtml(organization) : '';
    const safeMessage = sanitizeHtml(message).replace(/\n/g, '<br>');
    const safeIntentType = sanitizeHtml(intentType);
    
    const emailSubject = `[${routing.priority.toUpperCase()}] ${safeIntentType.charAt(0).toUpperCase() + safeIntentType.slice(1)} Inquiry - ${safeFirstName} ${safeLastName} (${ticketId})`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Sing for Hope</h1>
          <p style="margin: 5px 0 0 0;">New ${safeIntentType.charAt(0).toUpperCase() + safeIntentType.slice(1)} Inquiry</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; border-left: 4px solid #10b981;">
          <h2 style="color: #1f2937; margin-top: 0;">Ticket: ${ticketId}</h2>
          <p style="color: #6b7280; margin: 0;"><strong>Priority:</strong> ${routing.priority.toUpperCase()}</p>
          <p style="color: #6b7280; margin: 0;"><strong>Type:</strong> ${safeIntentType.charAt(0).toUpperCase() + safeIntentType.slice(1)} Inquiry</p>
        </div>
        
        <div style="padding: 20px;">
          <h3 style="color: #1f2937;">Contact Information</h3>
          <p><strong>Name:</strong> ${safeFirstName} ${safeLastName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          ${safePhoneNumber ? `<p><strong>Phone:</strong> ${safePhoneNumber}</p>` : ''}
          ${safeOrganization ? `<p><strong>Organization:</strong> ${safeOrganization}</p>` : ''}
          
          <h3 style="color: #1f2937;">Message</h3>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
            ${safeMessage}
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            <p>Submitted: ${new Date().toLocaleString()}</p>
            <p>Consent Given: ${consentGiven ? 'Yes' : 'No'}</p>
            <p>This message was sent through the Sing for Hope contact form.</p>
          </div>
        </div>
      </div>
    `;

    // Send internal notification email
    const CC_EMAIL = import.meta.env.CONTACT_CC_EMAIL;
    const emailOptions: any = {
      from: 'SFH Contact Form <notifications@mail.singforhope.org>',
      to: [routing.email],
      subject: emailSubject,
      html: emailHtml,
    };
    
    // Only add CC if environment variable is set
    if (CC_EMAIL) {
      emailOptions.cc = [CC_EMAIL];
    }
    
    const { error: emailError } = await resend.emails.send(emailOptions);

    if (emailError) {
      console.error('Email sending error:', emailError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to send notification email' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Send confirmation email to user
    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Thank You!</h1>
          <p style="margin: 5px 0 0 0;">We've received your message</p>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear ${safeFirstName},</p>
          
          <p>Thank you for reaching out to Sing for Hope! We've received your ${safeIntentType} inquiry and will get back to you soon.</p>
          
          <div style="background: #f0f9f4; border: 1px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Your Reference Number:</strong> ${ticketId}</p>
            <p style="margin: 10px 0 0 0; color: #059669;">Please keep this number for your records.</p>
          </div>
          
          <h3 style="color: #1f2937;">What happens next?</h3>
          ${intentType === 'press' ? `
            <p>Your press inquiry is high priority. Our media team will respond within 24 hours during business days.</p>
            <p>For urgent press requests, you may also contact us directly at <a href="mailto:press@singforhope.org">press@singforhope.org</a></p>
          ` : intentType === 'volunteer' ? `
            <p>Thank you for your interest in volunteering! Our volunteer coordinator will contact you within 2-3 business days with information about upcoming opportunities.</p>
            <p>In the meantime, you can learn more about our programs at <a href="https://singforhope.org/programs">singforhope.org/programs</a></p>
          ` : intentType === 'donor' ? `
            <p>Thank you for your interest in supporting our mission! Our development team will reach out within 1-2 business days to discuss how you can help bring art to communities in need.</p>
            <p>You can also make a donation anytime at <a href="https://singforhope.org/donate">singforhope.org/donate</a></p>
          ` : `
            <p>We typically respond to general inquiries within 2-3 business days.</p>
            <p>While you wait, feel free to explore our website to learn more about our programs and impact.</p>
          `}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Best regards,<br>
              The Sing for Hope Team
            </p>
            <div style="margin-top: 15px;">
              <a href="https://singforhope.org" style="color: #10b981; text-decoration: none;">🎵 singforhope.org</a> | 
              <a href="mailto:hello@singforhope.org" style="color: #10b981; text-decoration: none;">hello@singforhope.org</a>
            </div>
          </div>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: 'Sing for Hope <hello@mail.singforhope.org>',
      to: [email],
      subject: `Thank you for contacting Sing for Hope - ${ticketId}`,
      html: confirmationHtml,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      ticketId: ticketId,
      message: 'Your message has been sent successfully!' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'An unexpected error occurred. Please try again.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};