import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { getContract, getTicket, getEvent, getTokenURI } from '../utils/contractUtils';
import { ipfsToHttp } from '../utils/ipfsUtils';
import { getTicketFallbackImage } from '../utils/fallbackImageUtils';

const MyTickets = ({ isConnected, account }) => {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Redirect if not connected
    if (isConnected === false) {
      navigate('/');
      return;
    }

    const fetchUserTickets = async () => {
      try {
        setLoading(true);
        const contract = await getContract(false);

        // Get all transfer events where the user is the recipient
        const filter = contract.filters.Transfer(null, account);
        const events = await contract.queryFilter(filter);

        // Get unique token IDs
        const tokenIds = [...new Set(events.map(event => event.args.tokenId.toNumber()))];

        // Check if the user still owns these tokens
        const userTickets = [];

        for (const tokenId of tokenIds) {
          try {
            const currentOwner = await contract.ownerOf(tokenId);

            // Skip if user is not the current owner
            if (currentOwner.toLowerCase() !== account.toLowerCase()) {
              continue;
            }

            // Get ticket details
            const ticket = await getTicket(tokenId);

            // Get event details
            const event = await getEvent(ticket.eventId);

            // Get token URI and metadata
            const tokenURI = await getTokenURI(tokenId);
            let metadata = {};

            try {
              // Convert IPFS URI to HTTP URL
              const httpUrl = ipfsToHttp(tokenURI);
              const response = await fetch(httpUrl);
              metadata = await response.json();
            } catch (err) {
              console.error(`Error fetching metadata for token ${tokenId}:`, err);
              metadata = {
                name: `Ticket #${tokenId}`,
                description: 'Metadata unavailable',
                image: ''
              };
            }

            userTickets.push({
              tokenId,
              eventId: ticket.eventId,
              eventName: event.name,
              eventDate: event.date,
              used: ticket.used,
              locked: ticket.locked,
              metadata
            });
          } catch (err) {
            console.error(`Error processing token ${tokenId}:`, err);
            // Skip this token if there's an error
            continue;
          }
        }

        // Sort tickets by event date (upcoming first)
        userTickets.sort((a, b) => a.eventDate - b.eventDate);

        setTickets(userTickets);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user tickets:', err);
        setError('Failed to load your tickets. Please try again later.');
        setLoading(false);
      }
    };

    if (isConnected && account) {
      fetchUserTickets();
    }
  }, [isConnected, account, navigate]);

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if event is upcoming
  const isUpcoming = (date) => {
    return new Date(date) > new Date();
  };

  if (!isConnected) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return <div className="loading">Loading your tickets...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Group tickets by status
  const upcomingTickets = tickets.filter(ticket => isUpcoming(ticket.eventDate) && !ticket.used);
  const usedTickets = tickets.filter(ticket => ticket.used);
  const expiredTickets = tickets.filter(ticket => !isUpcoming(ticket.eventDate) && !ticket.used);

  // Render a ticket card
  const renderTicketCard = (ticket) => (
    <div
      key={ticket.tokenId}
      className={`ticket-card ${ticket.used ? 'used' : ''} ${!isUpcoming(ticket.eventDate) ? 'past' : ''}`}
    >
      <div className="ticket-image">
        <img
          src={
            // Use the metadata image if available (for existing tickets)
            ticket.metadata.image ? ipfsToHttp(ticket.metadata.image) :
            // Use a category-based fallback image
            getTicketFallbackImage({
              eventId: ticket.eventId,
              name: ticket.eventName,
              description: ticket.metadata.description || ''
            }, ticket.tokenId)
          }
          alt={ticket.metadata.name || `Ticket #${ticket.tokenId}`}
          onError={(e) => {
            e.target.onerror = null;
            // Use cultural image for ticket #0, otherwise use default ticket image
            if (ticket.tokenId === 0) {
              e.target.src = 'https://img.freepik.com/free-photo/traditional-cultural-dance-performance-stage_53876-138776.jpg';
            } else {
              e.target.src = 'https://img.freepik.com/free-vector/realistic-concert-entrance-tickets-set_1017-30605.jpg';
            }
            console.log(`Fallback to default image for ticket ${ticket.tokenId}`);
          }}
        />
        {ticket.used && <div className="used-overlay">USED</div>}
        {!isUpcoming(ticket.eventDate) && !ticket.used && <div className="expired-overlay">EXPIRED</div>}
        {ticket.locked && <div className="locked-badge">🔒</div>}

        {/* Add a special badge for ticket #0 */}
        {ticket.tokenId === 0 && (
          <div className="cultural-badge">Cultural</div>
        )}
      </div>

      <div className="ticket-info">
        <h3>{ticket.eventName}</h3>
        <p className="ticket-date">{formatDate(ticket.eventDate)}</p>
        <div className="ticket-details">
          <span className="ticket-id">Ticket #{ticket.tokenId}</span>
          {isUpcoming(ticket.eventDate) && !ticket.used && (
            <span className="ticket-status active">Active</span>
          )}
        </div>

        <Link to={`/tickets/${ticket.tokenId}`} className="view-ticket-btn">
          View Ticket
        </Link>
      </div>
    </div>
  );

  return (
    <div className="my-tickets-container">
      <div className="tickets-header">
        <h2>My Tickets</h2>
        <Link to="/events" className="browse-more-btn">
          Browse More Events
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="no-tickets">
          <div className="no-tickets-icon">🎫</div>
          <h3>You don't have any tickets yet</h3>
          <p>Browse our events and purchase tickets to see them here.</p>
          <Link to="/events" className="browse-events-btn">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="tickets-sections">
          {upcomingTickets.length > 0 && (
            <div className="tickets-section">
              <h3 className="section-title">Upcoming Events</h3>
              <div className="tickets-grid">
                {upcomingTickets.map(renderTicketCard)}
              </div>
            </div>
          )}

          {usedTickets.length > 0 && (
            <div className="tickets-section">
              <h3 className="section-title">Used Tickets</h3>
              <div className="tickets-grid">
                {usedTickets.map(renderTicketCard)}
              </div>
            </div>
          )}

          {expiredTickets.length > 0 && (
            <div className="tickets-section">
              <h3 className="section-title">Expired Tickets</h3>
              <div className="tickets-grid">
                {expiredTickets.map(renderTicketCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyTickets;
