interface ItemDetails {
  id: string;
  kind: "property" | "product";
  title: string;
  description: string;
  price: number;
  currency: string;
  address?: string;
  city?: string;
  images: { src: string }[];
  owner?: {
    name: string;
    email?: string;
    phone?: string;
  };
}

interface ApplicationEmailData {
  id: string;
  type: "property" | "marketplace";
  full_name: string;
  phone: string;
  email: string;
  date_of_birth?: string;
  residential_address: string;
  state: string;
  bvn?: string;
  nin?: string;
  id_type: string;
  employment_verification_required: boolean;
  employment_status?: string;
  employer_name?: string;
  job_title?: string;
  monthly_income?: string;
  employment_length?: string;
  property_id?: string;
  marketplace_id?: string;
  guarantor_name: string;
  guarantor_phone: string;
  guarantor_relationship: string;
  guarantor_employer: string;
  item?: ItemDetails;
  applicationUploads?: { src: string; name?: string }[];
}

export const generateApplicationEmail = (data: ApplicationEmailData) => {
  const { item: itemDetails } = data;
  const itemImagesHtml = itemDetails?.images?.length
    ? itemDetails.images.slice(0, 3)
        .map((img) => `\n          <img src="${img.src}" class="item-image" alt="Item Image" />`)
        .join("")
    : "";

  const uploads = data.applicationUploads || [];
  const uploadsHtml = uploads.length
    ? uploads
        .map((u) => {
          const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(u.name || u.src || "");
          return isImage
            ? `\n          <img src="${u.src}" class="item-image" alt="Uploaded Document" />`
            : `\n          <div class="row"><span class="label">Document:</span> <span class="value"><a href="${u.src}" target="_blank" rel="noopener">${u.name || "View Document"}</a></span></div>`;
        })
        .join("")
    : "";
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { background-color: #007B5D; color: #ffffff; padding: 20px; text-align: center; }
        .header h2 { margin: 0; font-size: 24px; }
        .content { padding: 20px; }
        .section { margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
        .section:last-child { border-bottom: none; }
        .section-title { font-size: 18px; color: #007B5D; margin-bottom: 10px; border-left: 4px solid #007B5D; padding-left: 10px; }
        .row { display: flex; margin-bottom: 8px; }
        .label { font-weight: 600; color: #555; width: 140px; flex-shrink: 0; }
        .value { color: #333; flex-grow: 1; }
        .footer { background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #777; }
        .item-image { max-width: 100%; height: auto; border-radius: 4px; margin-top: 10px; }
        .gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Installment Application</h2>
        </div>
        
        <div class="content">
          <p>A new installment application has been submitted with the following details:</p>

          <div class="section">
            <div class="section-title">General Info</div>
            <div class="row"><span class="label">Type:</span> <span class="value">${
              data.type
            }</span></div>
            <div class="row"><span class="label">Application ID:</span> <span class="value">${
              data.id
            }</span></div>
          </div>

          <div class="section">
            <div class="section-title">Personal Information</div>
            <div class="row"><span class="label">Full Name:</span> <span class="value">${
              data.full_name
            }</span></div>
            <div class="row"><span class="label">Phone:</span> <span class="value">${
              data.phone
            }</span></div>
            <div class="row"><span class="label">Email:</span> <span class="value">${
              data.email
            }</span></div>
            <div class="row"><span class="label">Date of Birth:</span> <span class="value">${
              data.date_of_birth
            }</span></div>
            <div class="row"><span class="label">Address:</span> <span class="value">${
              data.residential_address
            }</span></div>
            <div class="row"><span class="label">State:</span> <span class="value">${
              data.state
            }</span></div>
          </div>

          <div class="section">
            <div class="section-title">KYC Details</div>
            <div class="row"><span class="label">BVN:</span> <span class="value">${
              data.bvn || "N/A"
            }</span></div>
            <div class="row"><span class="label">NIN:</span> <span class="value">${
              data.nin || "N/A"
            }</span></div>
            <div class="row"><span class="label">ID Type:</span> <span class="value">${
              data.id_type
            }</span></div>
          </div>

          <div class="section">
            <div class="section-title">Employment Details</div>
            <div class="row"><span class="label">Verification:</span> <span class="value">${
              data.employment_verification_required ? "Required" : "Not Required"
            }</span></div>
            ${
              data.employment_verification_required
                ? `
            <div class="row"><span class="label">Status:</span> <span class="value">${data.employment_status}</span></div>
            <div class="row"><span class="label">Employer:</span> <span class="value">${data.employer_name}</span></div>
            <div class="row"><span class="label">Job Title:</span> <span class="value">${data.job_title}</span></div>
            <div class="row"><span class="label">Monthly Income:</span> <span class="value">${data.monthly_income}</span></div>
            <div class="row"><span class="label">Length:</span> <span class="value">${data.employment_length}</span></div>
            `
                : ""
            }
          </div>

          <div class="section">
            <div class="section-title">Product/Property Interest</div>
            ${
              data.property_id
                ? `<div class="row"><span class="label">Property ID:</span> <span class="value">${data.property_id}</span></div>`
                : ""
            }
            ${
              data.marketplace_id
                ? `<div class="row"><span class="label">Marketplace ID:</span> <span class="value">${data.marketplace_id}</span></div>`
                : ""
            }
            ${
              itemDetails
                ? `
            <div class="row"><span class="label">Title:</span> <span class="value">${itemDetails.title}</span></div>
            <div class="row"><span class="label">Price:</span> <span class="value">${itemDetails.currency} ${itemDetails.price}</span></div>
            <div class="row"><span class="label">Location:</span> <span class="value">${itemDetails.address || itemDetails.city || "N/A"}</span></div>
            <div class="row"><span class="label">Description:</span> <span class="value">${itemDetails.description}</span></div>
            ${itemDetails.owner ? `
              <div class="row"><span class="label">Owner:</span> <span class="value">${itemDetails.owner.name}</span></div>
              ${itemDetails.owner.email ? `<div class="row"><span class="label">Owner Email:</span> <span class="value">${itemDetails.owner.email}</span></div>` : ""}
              ${itemDetails.owner.phone ? `<div class="row"><span class="label">Owner Phone:</span> <span class="value">${itemDetails.owner.phone}</span></div>` : ""}
            ` : ""}
            ${itemImagesHtml ? `<div class="gallery">${itemImagesHtml}</div>` : ""}
            ` : ""
            }
          </div>

          ${uploadsHtml ? `
          <div class="section">
            <div class="section-title">Submitted Documents</div>
            ${uploadsHtml}
          </div>
          ` : ""}

          <div class="section">
            <div class="section-title">Guarantor Information</div>
            <div class="row"><span class="label">Name:</span> <span class="value">${
              data.guarantor_name
            }</span></div>
            <div class="row"><span class="label">Phone:</span> <span class="value">${
              data.guarantor_phone
            }</span></div>
            <div class="row"><span class="label">Relationship:</span> <span class="value">${
              data.guarantor_relationship
            }</span></div>
            <div class="row"><span class="label">Employer:</span> <span class="value">${
              data.guarantor_employer
            }</span></div>
          </div>
        </div>

        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Aje API. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

