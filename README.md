# Anchor Properties — ODI Demo (Commercial Real Estate / REIT)

Reference build of Fivetran's Open Data Infrastructure (ODI) for an institutional commercial-real-estate REIT.

**Anchor Properties** is a fictional publicly-traded REIT with a $42B portfolio:
- 480 office properties
- 280 industrial / logistics buildings
- 65 multifamily residential communities
- 18 mixed-use developments
- 38 US states

The demo speaks to a Chief Investment Officer and a VP of Asset Management.

## Architecture

Data sources land in Apache Iceberg on S3 via Fivetran custom connectors, dbt builds the silver and gold marts, AWS Athena serves the workload. Frontend is a static React SPA reading a JSON snapshot.

Sources:
- Yardi Voyager — property management and accounting
- MRI Software — legacy assets still on MRI
- VTS — leasing pipeline CRM
- Procore — capital projects
- Honeywell BMS — building management telemetry
- CoStar + RealCapitalAnalytics — market data feeds
- S&P credit-rating feed — tenant credit

## Local development

```bash
cd anchor-app/frontend
npm install
npm run dev
```

## Deploy

GitHub Pages workflow at `.github/workflows/deploy.yml` builds and deploys on every push to `main` that touches `anchor-app/**`.

Live URL: https://fivetran-jasonchletsos.github.io/RealEstate-ODI-Demo/

## Disclaimer

All data is synthetic. Anchor Properties is a fictional REIT. Tenant names, lease terms, and credit signals are invented. Nothing on this site constitutes investment advice.
