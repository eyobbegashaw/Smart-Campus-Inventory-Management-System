/**
 * Email template generator functions
 */

/**
 * Welcome email template
 */
const getWelcomeEmail = (user, password = null) => {
  return {
    subject: `Welcome to Campus Inventory System, ${user.name}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3b82f6; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Campus Inventory</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb;">
          <h2>Hello ${user.name},</h2>
          <p>Your account has been successfully created in the Campus Inventory Management System.</p>
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role.toUpperCase()}</p>
            ${password ? `<p><strong>Temporary Password:</strong> ${password}</p>` : ''}
          </div>
          ${password ? '<p>Please change your password after your first login.</p>' : ''}
          <a href="${process.env.FRONTEND_URL}/login" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Your Account</a>
        </div>
        <div style="background-color: #e5e7eb; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>© 2024 Campus Inventory System. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `Welcome to Campus Inventory System!\n\nHello ${user.name},\n\nYour account has been created.\nEmail: ${user.email}\nRole: ${user.role}\n${password ? `Temporary Password: ${password}\n` : ''}\nLogin at: ${process.env.FRONTEND_URL}/login`
  };
};

/**
 * Password reset email template
 */
const getPasswordResetEmail = (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  return {
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #ef4444; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Reset</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb;">
          <h2>Hello ${user.name},</h2>
          <p>You requested a password reset for your account. Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Reset Password</a>
          <p>This link will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 20px 0;">
          <p style="font-size: 12px; color: #6b7280;">Or copy this link: ${resetUrl}</p>
        </div>
        <div style="background-color: #e5e7eb; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>© 2024 Campus Inventory System. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `Password Reset Request\n\nHello ${user.name},\n\nYou requested a password reset. Click the link below to reset your password:\n${resetUrl}\n\nThis link expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`
  };
};

/**
 * Asset checkout confirmation email
 */
const getAssetCheckoutEmail = (asset, checkout, user) => {
  return {
    subject: `Asset Checkout Confirmation: ${asset.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #10b981; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Asset Checkout Confirmation</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb;">
          <h2>Dear ${user.name},</h2>
          <p>You have successfully checked out the following asset:</p>
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Asset Name:</strong> ${asset.name}</p>
            <p><strong>Asset Tag:</strong> ${asset.assetTag}</p>
            <p><strong>Checkout Date:</strong> ${new Date(checkout.createdAt).toLocaleString()}</p>
            <p><strong>Expected Return Date:</strong> ${new Date(checkout.expectedReturnDate).toLocaleDateString()}</p>
            <p><strong>Condition:</strong> ${checkout.condition || 'Good'}</p>
          </div>
          <p>Please return the asset by the expected return date to avoid penalties.</p>
          <a href="${process.env.FRONTEND_URL}/assets/${asset._id}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Asset Details</a>
        </div>
        <div style="background-color: #e5e7eb; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>© 2024 Campus Inventory System. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `Asset Checkout Confirmation\n\nDear ${user.name},\n\nYou have checked out:\nAsset: ${asset.name} (${asset.assetTag})\nDue Date: ${new Date(checkout.expectedReturnDate).toLocaleDateString()}\n\nPlease return by the due date.`
  };
};

/**
 * Service request status update email
 */
const getRequestStatusEmail = (request, user) => {
  return {
    subject: `Service Request Update: ${request.requestNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3b82f6; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Request Status Update</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb;">
          <h2>Dear ${user.name},</h2>
          <p>Your service request has been updated:</p>
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Request #:</strong> ${request.requestNumber}</p>
            <p><strong>Title:</strong> ${request.title}</p>
            <p><strong>Status:</strong> ${request.status.toUpperCase()}</p>
            ${request.assignedTo ? `<p><strong>Assigned To:</strong> ${request.assignedTo.name}</p>` : ''}
          </div>
          <a href="${process.env.FRONTEND_URL}/requests/${request._id}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Request Details</a>
        </div>
        <div style="background-color: #e5e7eb; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>© 2024 Campus Inventory System. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `Request Status Update\n\nDear ${user.name},\n\nRequest #${request.requestNumber} status: ${request.status}\n\nView details: ${process.env.FRONTEND_URL}/requests/${request._id}`
  };
};

/**
 * Low stock alert email
 */
const getLowStockAlertEmail = (item) => {
  return {
    subject: `Low Stock Alert: ${item.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #ef4444; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">⚠️ Low Stock Alert</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb;">
          <h2>Inventory Alert</h2>
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p><strong>Item:</strong> ${item.name}</p>
            <p><strong>SKU:</strong> ${item.sku}</p>
            <p><strong>Current Quantity:</strong> ${item.quantity} ${item.unit}</p>
            <p><strong>Minimum Required:</strong> ${item.minimumQuantity} ${item.unit}</p>
          </div>
          <a href="${process.env.FRONTEND_URL}/inventory" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Inventory</a>
        </div>
        <div style="background-color: #e5e7eb; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>© 2024 Campus Inventory System. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `Low Stock Alert!\n\nItem: ${item.name}\nCurrent Stock: ${item.quantity} ${item.unit}\nMinimum Required: ${item.minimumQuantity} ${item.unit}\n\nPlease reorder soon.`
  };
};

/**
 * Requisition approval email
 */
const getRequisitionApprovalEmail = (requisition, approver, status) => {
  return {
    subject: `Requisition ${status}: ${requisition.requisitionNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${status === 'approved' ? '#10b981' : '#ef4444'}; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Requisition ${status === 'approved' ? 'Approved' : 'Rejected'}</h1>
        </div>
        <div style="padding: 20px; background-color: #f9fafb;">
          <h2>Dear Requester,</h2>
          <p>Your requisition has been ${status} by ${approver.name}.</p>
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Requisition #:</strong> ${requisition.requisitionNumber}</p>
            <p><strong>Total Amount:</strong> ETB ${requisition.totalEstimatedPrice.toLocaleString()}</p>
            <p><strong>Status:</strong> ${status.toUpperCase()}</p>
          </div>
          <a href="${process.env.FRONTEND_URL}/requisitions/${requisition._id}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Requisition</a>
        </div>
        <div style="background-color: #e5e7eb; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>© 2024 Campus Inventory System. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `Requisition ${status === 'approved' ? 'Approved' : 'Rejected'}\n\nRequisition #${requisition.requisitionNumber}\nStatus: ${status}\nTotal: ETB ${requisition.totalEstimatedPrice.toLocaleString()}`
  };
};

module.exports = {
  getWelcomeEmail,
  getPasswordResetEmail,
  getAssetCheckoutEmail,
  getRequestStatusEmail,
  getLowStockAlertEmail,
  getRequisitionApprovalEmail
};
