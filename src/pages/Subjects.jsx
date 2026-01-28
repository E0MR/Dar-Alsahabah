import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Badge,
} from "reactstrap";
import { db } from "../db";
import { MdAdd, MdEdit, MdDelete } from "react-icons/md";
import ConfirmModal from "../components/common/ConfirmModal";

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [modal, setModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState(null);

  const initialFormState = {
    id: null,
    name: "",
    isMain: true,
    maxGrade: 100,
    paperCount: 1,
    paper1Name: "الورقة الأولى",
    paper2Name: "الورقة الثانية",
  };

  const [formData, setFormData] = useState(initialFormState);

  const loadSubjects = useCallback(async () => {
    try {
      const data = await db.subjects.toArray();
      setSubjects(data);
    } catch (error) {
      console.error("Failed to load subjects:", error);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await loadSubjects();
    };
    load();
  }, [loadSubjects]);

  const toggle = () => {
    setModal(!modal);
    if (!modal) {
      setEditMode(false);
      setFormData(initialFormState);
    }
  };

  const handleDeleteClick = (id) => {
    setTargetDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (targetDeleteId) {
      await db.subjects.delete(targetDeleteId);
      loadSubjects();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        name: formData.name.trim(),
        maxGrade: Number(formData.maxGrade),
        paperCount: Number(formData.paperCount),
        paper1Name: formData.paperCount === 2 ? formData.paper1Name : "",
        paper2Name: formData.paperCount === 2 ? formData.paper2Name : "",
      };

      if (editMode) {
        await db.subjects.update(formData.id, dataToSave);
      } else {
        const { id: _, ...newData } = dataToSave;
        await db.subjects.add(newData);
      }

      toggle();
      loadSubjects();
    } catch (error) {
      console.error("Error saving subject:", error);
    }
  };

  return (
    <Container fluid className="p-3 p-md-4">
      <div className="d-flex justify-content-between align-items-center mb-4 mt-3">
        <h2 className="fw-bold m-0" style={{ color: "var(--primary-color)" }}>
          📚 المواد الدراسية
        </h2>
        <Button
          color="primary"
          className="rounded-pill px-4 shadow-sm border-0"
          onClick={toggle}
        >
          <MdAdd size={22} className="ms-1" /> إضافة مادة
        </Button>
      </div>

      <Row className="g-4">
        {subjects.map((sub) => (
          <Col key={sub.id} xs="12" sm="6" lg="4" xl="3">
            <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden bg-card card-hover">
              <div className="p-3 d-flex justify-content-between align-items-start">
                <Badge
                  color={sub.isMain ? "primary" : "secondary"}
                  pill
                  className="px-3 py-2"
                >
                  {sub.isMain ? "أساسية" : "إضافية"}
                </Badge>
                <div className="d-flex gap-1">
                  <Button
                    color="link"
                    className="text-info p-0 shadow-none"
                    onClick={() => {
                      setFormData(sub);
                      setEditMode(true);
                      setModal(true);
                    }}
                  >
                    <MdEdit size={20} />
                  </Button>
                  <Button
                    color="link"
                    className="text-danger p-0 shadow-none"
                    onClick={() => handleDeleteClick(sub.id)}
                  >
                    <MdDelete size={20} />
                  </Button>
                </div>
              </div>
              <CardBody className="pt-0 text-center">
                <div className="display-6 mb-2 text-primary">📖</div>
                <h4 className="fw-bold mb-1">{sub.name}</h4>
                <p className="text-muted small mb-3">
                  الدرجة النهائية:{" "}
                  <span className="fw-bold">{sub.maxGrade}</span>
                </p>
                <div className="bg-light p-3 rounded-3 border d-flex flex-column justify-content-center" style={{ minHeight: '90px' }}>
                  <span className="fw-bold small">
                    {sub.paperCount === 1 ? "ورقة واحدة" : "ورقتان"}
                  </span>
                  {sub.paperCount === 2 && (
                    <div className="small text-muted mt-1 border-top pt-1 d-flex justify-content-center gap-2 flex-wrap">
                      <span>📄 {sub.paper1Name}</span>
                      <span className="text-secondary opacity-50">|</span>
                      <span>📄 {sub.paper2Name}</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </Col>
        ))}
        {subjects.length === 0 && (
          <Col xs="12" className="text-center py-5">
            <p className="text-muted fs-5">لا توجد مواد مضافة حالياً.</p>
          </Col>
        )}
      </Row>

      <Modal isOpen={modal} toggle={toggle} centered dir="rtl">
        <ModalHeader toggle={toggle} className="border-0 fw-bold">
          إعداد المادة
        </ModalHeader>
        <Form onSubmit={handleSubmit}>
          <ModalBody className="px-4">
            <FormGroup>
              <Label className="small fw-bold">اسم المادة</Label>
              <Input
                name="subject-name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </FormGroup>
            <FormGroup>
              <Label className="small fw-bold">الدرجة النهائية</Label>
              <Input
                name="max-grade"
                type="number"
                required
                value={formData.maxGrade}
                onChange={(e) =>
                  setFormData({ ...formData, maxGrade: e.target.value })
                }
              />
            </FormGroup>
            <FormGroup className="mt-3">
              <Label className="small fw-bold d-block">نظام الاختبار</Label>
              <div className="d-flex gap-3 p-2 bg-light rounded-3">
                <Label check className="mb-0">
                  <Input
                    name="paper-count"
                    type="radio"
                    checked={formData.paperCount === 1}
                    onChange={() => setFormData({ ...formData, paperCount: 1 })}
                  />{" "}
                  ورقة واحدة
                </Label>
                <Label check className="mb-0">
                  <Input
                    name="paper-count"
                    type="radio"
                    checked={formData.paperCount === 2}
                    onChange={() => setFormData({ ...formData, paperCount: 2 })}
                  />{" "}
                  ورقتان
                </Label>
              </div>
            </FormGroup>

            {formData.paperCount === 2 && (
              <div className="bg-primary bg-opacity-10 p-3 rounded-3 mt-3 border border-primary border-opacity-25">
                <Row className="g-2">
                  <Col md={6}>
                    <FormGroup className="mb-md-0">
                      <Label className="small fw-bold">اسم الورقة الأولى</Label>
                      <Input
                        name="paper1-name"
                        required
                        value={formData.paper1Name}
                        onChange={(e) =>
                          setFormData({ ...formData, paper1Name: e.target.value })
                        }
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup className="mb-0">
                      <Label className="small fw-bold">اسم الورقة الثانية</Label>
                      <Input
                        name="paper2-name"
                        required
                        value={formData.paper2Name}
                        onChange={(e) =>
                          setFormData({ ...formData, paper2Name: e.target.value })
                        }
                      />
                    </FormGroup>
                  </Col>
                </Row>
              </div>
            )}

            <FormGroup switch className="mt-4">
              <Input
                name="is-main"
                type="switch"
                checked={formData.isMain}
                onChange={() =>
                  setFormData({ ...formData, isMain: !formData.isMain })
                }
              />
              <Label check className="small fw-bold">
                مادة أساسية (تضاف للمجموع)
              </Label>
            </FormGroup>
          </ModalBody>
          <ModalFooter className="border-0">
            <Button
              color="light"
              onClick={toggle}
              className="rounded-pill px-4"
            >
              إلغاء
            </Button>
            <Button
              color="primary"
              type="submit"
              className="rounded-pill px-4 shadow-sm"
            >
              حفظ المادة
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <ConfirmModal
        isOpen={confirmOpen}
        toggle={() => setConfirmOpen(!confirmOpen)}
        onConfirm={confirmDelete}
        title="حذف المادة"
        message="هل أنت متأكد من حذف هذه المادة؟ سيؤدي ذلك لإزالتها من جميع الفصول المرتبطة بها."
      />
    </Container>
  );
};

export default Subjects;
