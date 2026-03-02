# AddressGuard: AI-Enhanced KYC & Address Verification

A prototype demonstrating AI-powered address verification for UK neobanks, addressing FCA enforcement gaps in customer onboarding.

## Background

In July 2025, the FCA fined Monzo £21.1M for AML control failures, specifically citing accounts opened with addresses like Buckingham Palace and 10 Downing Street. This followed Starling Bank's £28.9M fine in 2024 for similar failures.

This prototype demonstrates a solution: an AI-enhanced address verification layer that prevents implausible addresses from passing KYC checks while maintaining frictionless onboarding.

## Features

### Customer Onboarding Flow
- Postcode lookup with address selection
- Real-time plausibility scoring (0-100)
- Risk-based verification tiers:
  - **Low Risk (80-100):** Auto-approve, proceed to next step
  - **Medium Risk (40-79):** Request proof of address documentation
  - **High Risk (0-39):** Block and escalate to compliance team

### Compliance Dashboard
- Real-time verification statistics
- Manual review queue for flagged applications
- Implausible address detection log
- One-click approve/request docs/reject actions

## Demo Postcodes

Try these postcodes to see different verification outcomes:

| Postcode | Result | Reason |
|----------|--------|--------|
| SW1A 1AA | Blocked | Buckingham Palace - Government building |
| SW1A 2AA | Blocked | 10 Downing Street - Government building |
| E1 6AN | Mixed | Residential + Commercial addresses |
| M1 1AE | Approved | Residential addresses |
| B1 1AA | Review | Commercial property |

## Technical Architecture

The prototype simulates a four-layer verification approach:

1. **Existence Layer:** Royal Mail PAF validation
2. **Type Layer:** Property classification (residential/commercial/government)
3. **Identity Link Layer:** Electoral roll and credit bureau matching
4. **Risk Signals Layer:** ML-based plausibility scoring

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Lucide React (icons)

## Portfolio Context

This prototype is part of an AI Product Management portfolio demonstrating:
- Understanding of UK financial services regulation (FCA, AML)
- AI/ML product thinking (scoring models, eval frameworks)
- UX design for compliance products (balancing security with user experience)
- Technical architecture decisions (build vs. buy, data sources)

Full product spec available in the accompanying documentation.

## Author

Shanal Agrawal  
Senior B2B Product Manager transitioning to AI Product Management

## License

MIT - Free to use for learning and portfolio purposes.
