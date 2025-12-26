import { Hono } from "hono";
import { nanoid } from "nanoid";
import { db } from "../../db";
import { installmentApplication } from "../../db/schema";
import { uploadFiles } from "../../helpers/files";

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

    return c.json({ message: "Application submitted successfully", id });
  } catch (error) {
    console.error(error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

export default installmentRoutes;
