# Security Policy

## Project Overview

This is a personal development website (Silly Site) hosted on GitHub Pages. It includes:
- A main portfolio page with interactive rain animations
- An OpenStreetMap restaurant finder application (Finder)
- Progressive Web App (PWA) capabilities with offline support

## Supported Versions

This project is continuously deployed from the main branch. As a personal development site, there are no formal version releases. The latest commit on the main branch is always the supported version.

| Version | Supported          |
| ------- | ------------------ |
| Latest (main branch) | :white_check_mark: |
| Older commits | :x:                |

## Security Considerations

### API Key Storage
The Finder application supports integration with OpenAI-compatible APIs. API keys are:
- Stored only in browser session storage (not localStorage)
- Cleared when the browser is closed
- Never sent to our servers or stored in cookies (except for favorites backup)
- Users are responsible for their own API key security

### Third-Party Services
This site uses the following external services:
- OpenStreetMap (via Nominatim and Overpass APIs)
- Leaflet.js for mapping
- Swiper.js for slide functionality
- Tailwind CSS via CDN
- Optional: OpenAI-compatible API endpoints (user-configured)

### Content Security
- All user data (favorites, preferences) is stored locally in the browser
- No server-side data collection or processing
- Service Worker caches resources for offline functionality
- There is a EXfill script on the index page for testing purposes, please do not spam Messages to the webhook.

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it through one of the following methods:

1. **Email**: Send a detailed report to Admin@silly-site.me
2. **GitHub Issues**: For non-sensitive issues, you can open a GitHub issue (please do not include sensitive details in public issues)
3. **In Person**: If you know the maintainer personally, you can report it directly

### What to Include in Your Report

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if you have one)

### Response Time

As this is a personal project, I will make best efforts to:
- Acknowledge receipt of your report within 7 days
- Provide an initial assessment within 14 days
- Issue a fix for confirmed vulnerabilities as soon as reasonably possible

Thank you for helping keep this project secure!
