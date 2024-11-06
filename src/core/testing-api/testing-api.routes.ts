import { Request, Response, Router } from "express";
import { multerUpload } from "../../config/multer";

const testsRoute = Router();

const upload = multerUpload.fields([
  { name: "govtId", maxCount: 1 },
  { name: "cacDoc", maxCount: 1 },
  { name: "profilePhoto", maxCount: 1 },
]);

testsRoute.post("/upload", upload, (req: Request, res: Response) => {
  console.log(req.files, req.body);
  res.end();
});

export default testsRoute;
