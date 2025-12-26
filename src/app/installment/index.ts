import { Hono } from "hono";
import { nanoid } from "nanoid";
import { db } from "../../db";
import { installmentApplication, product, property, files } from "../../db/schema";
import { uploadFiles } from "../../helpers/files";
import { APPLICATION_EMAIL } from "../../constants";
import { sendEmail } from "../../helpers/email";
import { generateApplicationEmail } from "../../helpers/application-email";
import { eq } from "drizzle-orm";

const installmentRoutes = new Hono();

installmentRoutes.post("/application", async (c) => {
  try {
    const body = await c.req.parseBody();
    const {
      type,
      full_name,
      phone,
      email,
      date_of_birth,
      residential_address,
      state,
      bvn,
      nin,
      id_type,
      employment_verification_required,
      employment_status,
      employer_name,
      job_title,
      monthly_income,
      employment_length,
      property_id,
      marketplace_id,
      guarantor_name,
      guarantor_phone,
      guarantor_relationship,
      guarantor_employer,
    } = body;

    // Extract files
    const id_upload = body["id_upload"] as File;
    const payslip_upload = body["payslip_upload"] as File;
    const bank_statement = body["bank_statement"] as File;
    const guarantor_id_upload = body["guarantor_id_upload"] as File;

    const id = nanoid();

    await db.insert(installmentApplication).values({
      id,
      type: type as string,
      full_name: full_name as string,
      phone: phone as string,
      email: email as string,
      date_of_birth: date_of_birth
        ? new Date(date_of_birth as string)
        : undefined,
      residential_address: residential_address as string,
      state: state as string,
      bvn: bvn as string,
      nin: nin as string,
      id_type: id_type as string,
      employment_verification_required:
        employment_verification_required === "true",
      employment_status: employment_status as string,
      employer_name: employer_name as string,
      job_title: job_title as string,
      monthly_income: monthly_income as string,
      employment_length: employment_length as string,
      property_id: property_id as string,
      marketplace_id: marketplace_id as string,
      guarantor_name: guarantor_name as string,
      guarantor_phone: guarantor_phone as string,
      guarantor_relationship: guarantor_relationship as string,
      guarantor_employer: guarantor_employer as string,
    });

    const uploadPromises = [];

    if (id_upload) {
      uploadPromises.push(
        uploadFiles(id_upload, { installment_application_id: id })
      );
    }
    if (payslip_upload) {
      uploadPromises.push(
        uploadFiles(payslip_upload, { installment_application_id: id })
      );
    }
    if (bank_statement) {
      uploadPromises.push(
        uploadFiles(bank_statement, { installment_application_id: id })
      );
    }
    if (guarantor_id_upload) {
      uploadPromises.push(
        uploadFiles(guarantor_id_upload, { installment_application_id: id })
      );
    }

    await Promise.all(uploadPromises);

    const applicationFiles = await db.query.files.findMany({
      where: eq(files.installment_application_id, id),
    });

    let item: {
      id: string;
      kind: "property" | "product";
      title: string;
      description: string;
      price: number;
      currency: string;
      address?: string;
      city?: string;
      images: { src: string }[];
      owner?: { name: string; email?: string; phone?: string };
    } | undefined;

    if (type === "property" && property_id) {
      const p = await db.query.property.findFirst({
        where: eq(property.id, property_id as string),
        with: { user: true, images: true },
      });
      if (p) {
        item = {
          id: p.id,
          kind: "property",
          title: p.title,
          description: p.description,
          price: p.price ?? 0,
          currency: (p.currency as any) ?? "NGN",
          address: p.address ?? undefined,
          city: p.city ?? undefined,
          images: (p.images || []).map((f) => ({ src: f.src })),
          owner: p.user
            ? {
                name: `${p.user.first_name} ${p.user.last_name}`.trim(),
                email: p.user.email ?? undefined,
                phone: p.user.phone ?? undefined,
              }
            : undefined,
        };
      }
    } else if (type === "marketplace" && marketplace_id) {
      const prod = await db.query.product.findFirst({
        where: eq(product.id, marketplace_id as string),
        with: { user: true, images: true },
      });
      if (prod) {
        item = {
          id: prod.id,
          kind: "product",
          title: prod.title,
          description: prod.description,
          price: prod.price ?? 0,
          currency: (prod.currency as any) ?? "NGN",
          address: prod.address ?? undefined,
          city: prod.city ?? undefined,
          images: (prod.images || []).map((f) => ({ src: f.src })),
          owner: prod.user
            ? {
                name: `${prod.user.first_name} ${prod.user.last_name}`.trim(),
                email: prod.user.email ?? undefined,
                phone: prod.user.phone ?? undefined,
              }
            : undefined,
        };
      }
    }

    const emailHtml = generateApplicationEmail({
      id,
      type: (type as string) as "property" | "marketplace",
      full_name: full_name as string,
      phone: phone as string,
      email: email as string,
      date_of_birth: (date_of_birth as string) || undefined,
      residential_address: residential_address as string,
      state: state as string,
      bvn: (bvn as string) || undefined,
      nin: (nin as string) || undefined,
      id_type: id_type as string,
      employment_verification_required:
        employment_verification_required === "true",
      employment_status: (employment_status as string) || undefined,
      employer_name: (employer_name as string) || undefined,
      job_title: (job_title as string) || undefined,
      monthly_income: (monthly_income as string) || undefined,
      employment_length: (employment_length as string) || undefined,
      property_id: (property_id as string) || undefined,
      marketplace_id: (marketplace_id as string) || undefined,
      guarantor_name: guarantor_name as string,
      guarantor_phone: guarantor_phone as string,
      guarantor_relationship: guarantor_relationship as string,
      guarantor_employer: guarantor_employer as string,
      item,
      applicationUploads: (applicationFiles || []).map((f) => ({ src: f.src, name: f.name || undefined })),
    });

    await sendEmail({
      to: APPLICATION_EMAIL,
      subject: `New Installment Application - ${full_name}`,
      body: emailHtml,
    });

    return c.json({ message: "Application submitted successfully", id });
  } catch (error) {
    console.error(error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

export default installmentRoutes;
