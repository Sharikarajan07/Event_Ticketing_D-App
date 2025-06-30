/**
 * Utility functions for handling fallback images for events and tickets
 */

// Default event image URLs - using direct image URLs that are reliable
const DEFAULT_EVENT_IMAGES = [
  'https://cdn.pixabay.com/photo/2016/11/23/15/48/audience-1853662_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/11/22/19/15/hand-1850120_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/07/21/23/57/concert-2527495_1280.jpg',
  'https://cdn.pixabay.com/photo/2016/11/29/06/17/audience-1867754_1280.jpg',
  'https://cdn.pixabay.com/photo/2017/01/06/23/03/sunrise-1959227_1280.jpg'
];

// Default ticket image URLs - specifically designed for tickets
const DEFAULT_TICKET_IMAGES = [
  'https://img.freepik.com/free-vector/realistic-concert-entrance-tickets-set_1017-30605.jpg',
  'https://img.freepik.com/free-vector/realistic-golden-ticket-template_52683-35936.jpg',
  'https://img.freepik.com/free-vector/cinema-tickets-set_1017-30634.jpg',
  'https://img.freepik.com/free-vector/realistic-concert-entrance-tickets-set_1017-30605.jpg',
  'https://img.freepik.com/free-vector/realistic-concert-entrance-tickets-set_1017-30605.jpg'
];

// Cultural-themed images for special tickets
const CULTURAL_TICKET_IMAGES = [
  'https://img.freepik.com/free-photo/traditional-cultural-dance-performance-stage_53876-138776.jpg',
  'https://img.freepik.com/free-photo/group-people-traditional-indian-clothes_23-2149064512.jpg',
  'https://img.freepik.com/free-photo/woman-dancing-traditional-chinese-clothing_23-2149064502.jpg',
  'https://img.freepik.com/free-photo/african-american-jazz-musician-playing-trumpet_23-2149071755.jpg',
  'https://img.freepik.com/free-photo/traditional-mexican-hat-with-decorations_23-2149067702.jpg'
];

/**
 * Get a fallback image URL for an event based on its ID
 * This is used for events that were created before image upload was required
 *
 * @param {Object} event - The event object with eventId
 * @returns {string} - The fallback image URL
 */
export const getEventFallbackImage = (event) => {
  if (!event) return DEFAULT_EVENT_IMAGES[0];

  // Use the event ID to select a consistent image from the array
  const index = event.eventId % DEFAULT_EVENT_IMAGES.length;
  return DEFAULT_EVENT_IMAGES[index];
};

/**
 * Get a fallback image URL for a ticket based on its event
 *
 * @param {Object} event - The event object
 * @param {number} ticketId - The ticket ID
 * @returns {string} - The fallback image URL
 */
export const getTicketFallbackImage = (event, ticketId) => {
  if (!event) return DEFAULT_TICKET_IMAGES[0];

  // Special case for ticket #0 - use a cultural-themed image
  if (ticketId === 0 || ticketId === '0') {
    // Always use a cultural image for ticket #0
    return CULTURAL_TICKET_IMAGES[0];
  }

  // Check if this is a cultural event for other tickets
  if (event.name && event.name.toLowerCase().includes('cultural') ||
      (event.description && event.description.toLowerCase().includes('cultural'))) {
    // Use a consistent cultural image based on the ticket ID
    const culturalIndex = (typeof ticketId === 'number' ? ticketId : 0) % CULTURAL_TICKET_IMAGES.length;
    return CULTURAL_TICKET_IMAGES[culturalIndex];
  }

  // Use the ticket ID to select a consistent image from the array
  const ticketIndex = (typeof ticketId === 'number' ? ticketId : 0) % DEFAULT_TICKET_IMAGES.length;
  return DEFAULT_TICKET_IMAGES[ticketIndex];
};
