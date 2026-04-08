const nodemailer = require('nodemailer');
const User = require('../models/User');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send email notification
 * @param {Object} options - Email options
 * @returns {Promise<void>}
 */
async function sendEmail(options) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@campus.edu',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

/**
 * Send notification to user based on preferences
 * @param {Object} user - User object
 * @param {Object} notification - Notification data
 * @returns {Promise<void>}
 */
async function sendNotification(user, notification) {
  const preferences = user.preferences?.notifications || { email: true, push: true };
  
  // Send email if enabled
  if (preferences.email && notification.email) {
    await sendEmail({
      to: user.email,
      subject: notification.subject,
      html: notification.html,
      text: notification.text
    });
  }
  
  // Send push notification via socket (handled in real-time)
  if (preferences.push && notification.pushData) {
    const io = require('../server').io;
    if (io) {
      io.to(`user-${user._id}`).emit('notification', {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.pushData
      });
    }
  }
}

/**
 * Send asset checkout notification
 * @param {Object} asset - Asset object
 * @param {Object} checkout - Checkout object
 * @param {Object} user - User who checked out
 * @returns {Promise<void>}
 */
async function notifyAssetCheckout(asset, checkout, user) {
  const emailHtml = `
    <h2>Asset Checkout Confirmation</h2>
    <p>Dear ${user.name},</p>
    <p>You have checked out the following asset:</p>
    <ul>
      <li><strong>Asset:</strong> ${asset.name} (${asset.assetTag})</li>
      <li><strong>Expected Return Date:</strong> ${new Date(checkout.expectedReturnDate).toLocaleDateString()}</li>
      <li><strong>Condition:</strong> ${checkout.condition}</li>
    </ul>
    <p>Please return the asset by the expected return date to avoid penalties.</p>
    <p>Thank you!</p>
  `;
  
  await sendNotification(user, {
    email: true,
    subject: `Asset Checkout: ${asset.name}`,
    html: emailHtml,
    text: `You have checked out ${asset.name} (${asset.assetTag}). Due: ${new Date(checkout.expectedReturnDate).toLocaleDateString()}`,
    type: 'checkout',
    title: 'Asset Checkout',
    message: `You checked out ${asset.name}`,
    pushData: { assetId: asset._id, checkoutId: checkout._id }
  });
}

/**
 * Send service request notification
 * @param {Object} request - Service request object
 * @param {Object} recipient - Recipient user
 * @param {string} action - Action type
 * @returns {Promise<void>}
 */
async function notifyServiceRequest(request, recipient, action) {
  let subject, html, message;
  
  switch (action) {
    case 'created':
      subject = `New Service Request: ${request.requestNumber}`;
      html = `
        <h2>New Service Request Created</h2>
        <p>A new service request has been created:</p>
        <ul>
          <li><strong>Request #:</strong> ${request.requestNumber}</li>
          <li><strong>Title:</strong> ${request.title}</li>
          <li><strong>Location:</strong> ${request.location}</li>
          <li><strong>Priority:</strong> ${request.priority}</li>
        </ul>
        <p><a href="${process.env.FRONTEND_URL}/requests/${request._id}">View Request</a></p>
      `;
      message = `New request: ${request.title}`;
      break;
      
    case 'assigned':
      subject = `Request Assigned: ${request.requestNumber}`;
      html = `
        <h2>Service Request Assigned to You</h2>
        <p>You have been assigned to the following request:</p>
        <ul>
          <li><strong>Request #:</strong> ${request.requestNumber}</li>
          <li><strong>Title:</strong> ${request.title}</li>
          <li><strong>Location:</strong> ${request.location}</li>
          <li><strong>Priority:</strong> ${request.priority}</li>
        </ul>
        <p><a href="${process.env.FRONTEND_URL}/requests/${request._id}">View Request</a></p>
      `;
      message = `Request assigned: ${request.title}`;
      break;
      
    case 'updated':
      subject = `Request Status Update: ${request.requestNumber}`;
      html = `
        <h2>Service Request Status Updated</h2>
        <p>Your request "${request.title}" has been updated to: <strong>${request.status}</strong></p>
        <p><a href="${process.env.FRONTEND_URL}/requests/${request._id}">View Request</a></p>
      `;
      message = `Request status: ${request.status}`;
      break;
      
    case 'completed':
      subject = `Request Completed: ${request.requestNumber}`;
      html = `
        <h2>Service Request Completed</h2>
        <p>Your request "${request.title}" has been marked as completed.</p>
        ${request.resolution ? `<p><strong>Resolution:</strong> ${request.resolution}</p>` : ''}
        <p><a href="${process.env.FRONTEND_URL}/requests/${request._id}">View Request</a></p>
      `;
      message = `Request completed: ${request.title}`;
      break;
      
    default:
      return;
  }
  
  await sendNotification(recipient, {
    email: true,
    subject,
    html,
    text: message,
    type: 'request',
    title: 'Service Request Update',
    message,
    pushData: { requestId: request._id, status: request.status }
  });
}

/**
 * Send low stock alert
 * @param {Object} item - Inventory item
 * @param {Array} recipients - Array of users to notify
 * @returns {Promise<void>}
 */
async function notifyLowStock(item, recipients) {
  const emailHtml = `
    <h2>Low Stock Alert</h2>
    <p>The following item is running low on stock:</p>
    <ul>
      <li><strong>Item:</strong> ${item.name}</li>
      <li><strong>SKU:</strong> ${item.sku}</li>
      <li><strong>Current Quantity:</strong> ${item.quantity} ${item.unit}</li>
      <li><strong>Minimum Required:</strong> ${item.minimumQuantity} ${item.unit}</li>
    </ul>
    <p>Please reorder soon to avoid stockout.</p>
  `;
  
  for (const recipient of recipients) {
    await sendNotification(recipient, {
      email: true,
      subject: `Low Stock Alert: ${item.name}`,
      html: emailHtml,
      text: `${item.name} is low on stock. Current: ${item.quantity} ${item.unit}`,
      type: 'inventory',
      title: 'Low Stock Alert',
      message: `${item.name} is low on stock`,
      pushData: { itemId: item._id }
    });
  }
}

/**
 * Send overdue asset notification
 * @param {Object} checkout - Checkout object
 * @param {Object} asset - Asset object
 * @param {Object} user - User who checked out
 * @returns {Promise<void>}
 */
async function notifyOverdueAsset(checkout, asset, user) {
  const overdueDays = Math.ceil((new Date() - new Date(checkout.expectedReturnDate)) / (1000 * 60 * 60 * 24));
  
  const emailHtml = `
    <h2>Overdue Asset Alert</h2>
    <p>Dear ${user.name},</p>
    <p>The following asset is overdue:</p>
    <ul>
      <li><strong>Asset:</strong> ${asset.name} (${asset.assetTag})</li>
      <li><strong>Checkout Date:</strong> ${new Date(checkout.createdAt).toLocaleDateString()}</li>
      <li><strong>Expected Return Date:</strong> ${new Date(checkout.expectedReturnDate).toLocaleDateString()}</li>
      <li><strong>Days Overdue:</strong> ${overdueDays}</li>
    </ul>
    <p>Please return the asset immediately to avoid additional fines.</p>
    <p><a href="${process.env.FRONTEND_URL}/assets/${asset._id}">View Asset</a></p>
  `;
  
  await sendNotification(user, {
    email: true,
    subject: `Overdue Asset: ${asset.name}`,
    html: emailHtml,
    text: `${asset.name} is ${overdueDays} days overdue. Please return it.`,
    type: 'overdue',
    title: 'Overdue Asset',
    message: `${asset.name} is overdue by ${overdueDays} days`,
    pushData: { assetId: asset._id, checkoutId: checkout._id }
  });
}

/**
 * Send welcome email to new user
 * @param {Object} user - User object
 * @param {string} password - Temporary password (if auto-generated)
 * @returns {Promise<void>}
 */
async function sendWelcomeEmail(user, password = null) {
  let html = `
    <h2>Welcome to Campus Inventory System!</h2>
    <p>Dear ${user.name},</p>
    <p>Your account has been created successfully.</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Role:</strong> ${user.role}</p>
  `;
  
  if (password) {
    html += `<p><strong>Temporary Password:</strong> ${password}</p>`;
    html += `<p>Please change your password after first login.</p>`;
  }
  
  html += `<p><a href="${process.env.FRONTEND_URL}/login">Click here to login</a></p>`;
  
  await sendEmail({
    to: user.email,
    subject: 'Welcome to Campus Inventory System',
    html
  });
}

/**
 * Send password reset email
 * @param {Object} user - User object
 * @param {string} resetToken - Password reset token
 * @returns {Promise<void>}
 */
async function sendPasswordResetEmail(user, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  const html = `
    <h2>Password Reset Request</h2>
    <p>You requested a password reset for your account.</p>
    <p>Click the link below to reset your password:</p>
    <p><a href="${resetUrl}">Reset Password</a></p>
    <p>This link expires in 10 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  
  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html
  });
}

/**
 * Send requisition approval notification
 * @param {Object} requisition - Requisition object
 * @param {Object} approver - Approver user
 * @param {string} action - Approval action
 * @returns {Promise<void>}
 */
async function notifyRequisitionApproval(requisition, approver, action) {
  const emailHtml = `
    <h2>Requisition ${action === 'approved' ? 'Approved' : 'Rejected'}</h2>
    <p>Dear ${requisition.requester.name},</p>
    <p>Your requisition (${requisition.requisitionNumber}) has been ${action} by ${approver.name}.</p>
    ${requisition.totalEstimatedPrice ? `<p><strong>Total Amount:</strong> ETB ${requisition.totalEstimatedPrice.toLocaleString()}</p>` : ''}
    <p><a href="${process.env.FRONTEND_URL}/requisitions/${requisition._id}">View Requisition</a></p>
  `;
  
  await sendNotification(requisition.requester, {
    email: true,
    subject: `Requisition ${action === 'approved' ? 'Approved' : 'Rejected'}: ${requisition.requisitionNumber}`,
    html: emailHtml,
    text: `Your requisition ${requisition.requisitionNumber} has been ${action}`,
    type: 'requisition',
    title: `Requisition ${action === 'approved' ? 'Approved' : 'Rejected'}`,
    message: `Requisition ${requisition.requisitionNumber} has been ${action}`,
    pushData: { requisitionId: requisition._id, status: action }
  });
}

module.exports = {
  sendEmail,
  sendNotification,
  notifyAssetCheckout,
  notifyServiceRequest,
  notifyLowStock,
  notifyOverdueAsset,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  notifyRequisitionApproval
};
