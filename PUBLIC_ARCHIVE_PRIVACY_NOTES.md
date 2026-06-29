# GLAMOPH Archive Privacy Notes

This public archive package has been sanitized for the dStudio-safe flow.

- `order-contact-index.json` is empty. Customer information must be stored in the private webhook storage repo.
- `issued-index.json` is empty. Issued/order mapping must be stored in the private webhook storage repo.
- Record `data.json` files contain no owner token and no customer details.
- Public `certificate.pdf` files have been removed. Collector PDFs are served dynamically from the webhook app after token validation.

If old public files already exist on GitHub Pages, delete old public `certificate.pdf` files and old owner-token HTML/data manually or replace the branch with this sanitized tree.
