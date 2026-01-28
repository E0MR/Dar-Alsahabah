import { Button } from "reactstrap";
import { MdOutlineDownload, MdOutlineUpload } from "react-icons/md";

const ActionButtons = ({ onExport, onImport }) => (
  <div className="d-flex justify-content-center gap-3">
    <Button
      color="primary"
      onClick={onExport}
      className="rounded-pill px-4 shadow-sm fw-bold border-0 d-flex align-items-center gap-2"
    >
      <MdOutlineDownload size={22} /> تصدير نسخة
    </Button>

    <label
      className="btn btn-outline-primary mb-0 rounded-pill px-4 shadow-sm fw-bold d-flex align-items-center gap-2"
      style={{ cursor: "pointer" }}
    >
      <MdOutlineUpload size={22} /> استيراد نسخة
      <input name="import-file" type="file" hidden onChange={onImport} accept=".json" />
    </label>
  </div>
);

export default ActionButtons;
