export function bookingConfirmedTemplate(data) {
  return {
    subject: `Booking Confirmed – ${data.eventTitle || 'Your Event'}`,
    html: `
      <h2>Your booking is confirmed! 🎉</h2>
      <p>Hello,</p>
      <p>Your booking for <strong>${data.eventTitle || 'the event'}</strong> has been confirmed.</p>
      <p>Booking ID: <strong>${data.bookingId}</strong></p>
      <p>Show your QR code at the entrance.</p>
      <br/>
      <p>See you there!</p>
      <p>– The EMS Team</p>
    `,
  };
}

export function bookingCancelledTemplate(data) {
  return {
    subject: `Booking Cancelled – ${data.eventTitle || 'Your Event'}`,
    html: `
      <h2>Your booking has been cancelled</h2>
      <p>Booking ID: <strong>${data.bookingId}</strong> has been cancelled.</p>
      <p>If this was unexpected, please contact support.</p>
      <p>– The EMS Team</p>
    `,
  };
}

export function eventApprovedTemplate(data) {
  return {
    subject: `Your Event Has Been Approved – ${data.eventTitle || 'Your Event'}`,
    html: `
      <h2>Great news! Your event is approved 🎊</h2>
      <p>Your event <strong>${data.eventTitle}</strong> has been approved and is now live.</p>
      <p>– The EMS Team</p>
    `,
  };
}
