# Kindred Collective — Product Requirements Document (v1.0)

> Raw source. Plain-text extraction from `Kindred-Collective-PRD.docx` (repo root), extracted 2026-07-05.
> Table cells appear as consecutive lines. The .docx is the canonical original.

PRODUCT REQUIREMENTS DOCUMENT
Kindred Collective
Website Rebuild
The Independent Drinks Ecosystem
Version:
1.0
Date:
January 15, 2026
Author:
Tim (Avallen Solutions)
Status:
Draft
1. Executive Summary
Kindred Collective is the UK's leading marketplace platform connecting independent drinks brands with suppliers, manufacturers, and service providers. This PRD outlines the complete rebuild of kindredcollective.co.uk to deliver an enhanced user experience, new functionality, and scalable architecture.
The rebuilt platform will support two distinct user types (Brands and Suppliers), feature AI-powered search capabilities, community networking tools, event management, and an exclusive offers marketplace. All existing data from the current Kindred Collective site will be migrated to ensure continuity.
2. Product Vision
2.1 Mission Statement
To empower independent drinks makers with the tools, connections, and resources they need to build exceptional products and thriving businesses.
2.2 Target Audience
Independent drinks brands (spirits, beer, wine, RTD, no/lo alcohol)
Suppliers (packaging, ingredients, logistics, co-packing, design)
Industry professionals (founders, distillers, buyers, consultants)
2.3 Design Language
The platform will adopt a Neo-Brutalist design aesthetic featuring bold typography (Space Grotesk + Inter), high-contrast black borders, distinctive shadows, and a vibrant accent palette (Cyan #00D9FF, Coral #FF5D5D, Lime #CCFF00). This positions Kindred as a modern, disruptive force in the industry.
3. User Types & Profiles
3.1 Brand Users
Independent drinks producers seeking suppliers and industry connections.
Profile Fields:
Company name, logo, and cover image
Location (city, country)
Category (Spirits, Beer, Wine, RTD, No/Lo)
Product description and brand story
Social media links
Tags/certifications (Organic, B-Corp, etc.)
Team members with individual profiles
3.2 Supplier Users
Service providers, manufacturers, and vendors serving the drinks industry.
Profile Fields:
Company name, logo, and portfolio images
Location and service regions
Service category (Packaging, Ingredients, Logistics, Co-Packing, Creative)
Capabilities and specializations
Minimum Order Quantity (MOQ)
Certifications (Organic, B-Corp, Plastic-Free, Fair Trade)
Verification badge status
Active offers/discounts
4. Core Features
4.1 Supplier Marketplace
A searchable directory of verified suppliers with advanced filtering capabilities.
Feature
Priority
Description
Search & Filter
P0
Full-text search with filters for category, location, MOQ, and certifications
AI Search
P0
Natural language search powered by AI (e.g., 'organic agave suppliers with low MOQs')
Supplier Cards
P0
Profile cards showing key info, images, tags, and quick actions
Favorites
P1
Save suppliers to a personal shortlist for later reference
Verified Badges
P1
Trust indicators for vetted suppliers
RFP System
P2
Brands can post Requests for Proposals for suppliers to respond
4.2 Brand Directory
A showcase of independent drinks brands in the Kindred community.
Feature
Priority
Description
Brand Profiles
P0
Rich profile pages with imagery, story, and product details
Category Filters
P0
Filter by Spirits, Beer, Wine, RTD, No/Lo categories
Trending Tags
P1
Highlight trending and newly added brands
Team Members
P1
Link individual member profiles to brand pages
4.3 Discounts & Offers Hub
Exclusive deals from suppliers available only to Kindred members.
Feature
Priority
Description
Offer Cards
P0
Display discount code, expiry date, and supplier info
Claim Tracking
P1
Track which offers have been claimed by brands
Supplier Dashboard
P0
Interface for suppliers to create and manage offers
Expiry Alerts
P1
Notify brands when saved offers are expiring
Featured Offers
P2
Promoted placement for premium supplier offers
4.4 Events & Trade Show Meetups
Calendar of industry events with attendance registration and networking features.
Feature
Priority
Description
Event Listings
P0
Display upcoming events with date, location, and details
RSVP System
P0
Register attendance for events (online/in-person)
Attendee Visibility
P0
Show which members are attending each event
Featured Events
P0
Hero section for major events like annual parties
Event Calendar
P1
Calendar view with filtering options
Ticketing Integration
P2
Connect with external ticketing platforms
4.5 Member Directory
Searchable directory of community members for networking.
Feature
Priority
Description
Member Profiles
P0
Individual profiles with photo, role, and company affiliation
Search
P0
Search members by name, company, or role
Contact Links
P1
WhatsApp, LinkedIn, or email contact options
Activity Status
P2
Show member engagement and recent activity
4.6 Industry News Feed
Curated industry news and updates via RSS integration.
Feature
Priority
Description
RSS Integration
P1
Aggregate news from curated industry sources
Article Cards
P1
Display headline, source, date, and thumbnail
Category Filters
P2
Filter news by topic (regulations, trends, launches)
Save Articles
P2
Bookmark articles for later reading
4.7 AI-Powered Search
Intelligent search assistant to help brands find ideal suppliers.
Feature
Priority
Description
Natural Language
P0
Accept queries like 'glass bottles with embossing in Europe'
Smart Matching
P0
Rank results by relevance to query intent
Recommendations
P1
Suggest suppliers based on user profile and history
Conversational UI
P2
Multi-turn dialog to refine search requirements
5. Data Migration
All existing content from kindredcollective.co.uk will be migrated to the new platform to ensure continuity and preserve the community's established network.
Migration Scope:
All existing supplier profiles and company data
Brand profiles and product information
User accounts and authentication credentials
Historical event data and attendance records
Existing offers and discount codes
Media assets (images, logos, documents)
6. Technical Requirements
6.1 Database Architecture
Separate collections/tables for Brands and Suppliers
Relational links between users, companies, and events
Full-text search indexing for AI-powered queries
Scalable architecture to support 10,000+ profiles
6.2 Authentication & Authorization
Email/password and social login (Google, LinkedIn)
Role-based access control (Brand, Supplier, Admin)
Profile verification workflow for suppliers
6.3 Integrations
RSS feed aggregation for industry news
AI/LLM API for natural language search (OpenAI/Anthropic)
Email service for notifications and newsletters
Analytics platform for usage tracking
6.4 Performance Requirements
Page load time < 2 seconds
Search results returned < 500ms
Mobile-first responsive design
99.9% uptime SLA
7. Information Architecture
Primary Navigation:
Home - Hero, featured partners, toolkit overview, offers preview
Explore - Supplier marketplace with AI search and filters
Community - Brand directory, member profiles, events
AI Search - Dedicated natural language search interface
Dashboard - User profile, saved items, offer management (logged in)
Footer Links:
About Us, Manifesto, Contact
Pricing, Terms, Privacy Policy
Social media (Twitter, Instagram, LinkedIn)
8. Success Metrics
Metric
Target
Measurement
Monthly Active Users
5,000+ within 6 months
Analytics dashboard
Supplier Profiles
3,000+ verified
Database count
Brand Profiles
1,000+ registered
Database count
Offer Claims
500+ monthly
Claim tracking
Event RSVPs
50%+ attendance rate
Event management
AI Search Usage
30%+ of all searches
Search analytics
9. Project Timeline
Phase
Duration
Deliverables
Phase 1
Weeks 1-4
Design system, database schema, authentication
Phase 2
Weeks 5-8
Supplier marketplace, brand directory, profiles
Phase 3
Weeks 9-12
Events system, offers hub, member directory
Phase 4
Weeks 13-16
AI search integration, news feed, data migration
Phase 5
Weeks 17-20
Testing, optimization, launch preparation
10. Appendix
10.1 Design References
The following HTML design files have been provided as reference for the visual direction:
01-kindred-collective-exclusive-offers.html - Homepage with hero, features, and offers
02-explore-suppliers-kindred-collective-cyan.html - Supplier marketplace with filters
03-community-kindred-collective.html - Community page with events and members
10.2 Brand Colors
Color
Hex Code
Usage
Cyan
#00D9FF
Primary accent
Coral
#FF5D5D
Alerts, featured
Lime
#CCFF00
New, success
Blue
#3B82F6
Verified, info
Black
#000000
Text, borders
10.3 Typography
Display Font: Space Grotesk (headings, titles)
Body Font: Inter (paragraphs, UI elements)
Styling: Bold uppercase for labels, generous letter-spacing
— End of Document —
