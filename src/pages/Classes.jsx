import React, { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Badge,
} from "reactstrap";
import { FaPlus, FaSchool } from "react-icons/fa";
import { MdMenuBook, MdPerson, MdEdit, MdDelete, MdClass } from "react-icons/md";
import GenericModal from "../components/common/GenericModal";
import ConfirmModal from "../components/common/ConfirmModal";

const Classes = () => {
  const navigate = useNavigate();
  // Fetch classes and students to calculate counts
  const classes = useLiveQuery(() => db.classes.toArray());
  const students = useLiveQuery(() => db.students.toArray());
  const allSubjects = useLiveQuery(() => db.subjects.toArray());

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classTitle, setClassTitle] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  // Confirmation state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState(null);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (modalOpen) {
      setEditingClass(null);
      setClassTitle("");
      setSelectedSubjects([]);
    }
  };

  const handleEdit = (e, cls) => {
    e.stopPropagation(); // Stop card click
    setEditingClass(cls);
    setClassTitle(cls.title);
    setSelectedSubjects(cls.subjectIds || []);
    setModalOpen(true);
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation(); // Stop card click
    setTargetDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (targetDeleteId) {
      // Find students in this class
      const classStudents = await db.students.where({ classId: String(targetDeleteId) }).toArray();
      const studentIds = classStudents.map(s => s.id);

      // Delete the class
      await db.classes.delete(targetDeleteId);

      // Delete students and their grades
      if (studentIds.length > 0) {
        await db.students.bulkDelete(studentIds);
        await db.grades.where('studentId').anyOf(studentIds).delete();
      }
    }
  };

  const handleSave = async () => {
    if (!classTitle.trim()) return;

    const classData = {
      title: classTitle,
      subjectIds: selectedSubjects,
    };

    if (editingClass) {
      await db.classes.update(editingClass.id, classData);
    } else {
      await db.classes.add(classData);
    }
    toggleModal();
  };

  const handleSubjectChange = (subjectId) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const getStudentCount = (classId) => {
    return students?.filter(s => s.classId == classId).length || 0;
  };

  return (
    <Container fluid className="p-3 p-md-4">
      <Row className="mb-4">
        <Col className="d-flex justify-content-between align-items-center">
          <h2 className="text-secondary fw-bold d-flex align-items-center gap-2" style={{ color: "var(--primary-color)" }}>
            🏫 إدارة الصفوف الدراسية
          </h2>
          <Button color="success" onClick={toggleModal} className="rounded-pill px-4 shadow-sm">
            <FaPlus className="me-2" /> إدراج صف جديد
          </Button>
        </Col>
      </Row>

      <Row className="g-4">
        {classes?.map((cls) => (
          <Col key={cls.id} xs="12" sm="6" md="4" lg="3">
            <Card
              className="h-100 border-0 shadow-sm rounded-4 overflow-hidden bg-card card-hover text-center cursor-pointer"
              onClick={() => navigate(`/classes/${cls.id}`)}
              style={{ transition: "transform 0.2s" }}
            >
              <div className="p-3 d-flex justify-content-between align-items-start">
                <Badge color="light" pill className="d-flex align-items-center gap-1 px-3 py-2 border text-dark">
                  <MdMenuBook size={16} className="text-primary" />
                  {cls.subjectIds?.length || 0}
                </Badge>
                <div className="d-flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    color="link"
                    className="text-info p-0 shadow-none"
                    onClick={(e) => handleEdit(e, cls)}
                    title="تعديل"
                  >
                    <MdEdit size={20} />
                  </Button>
                  <Button
                    color="link"
                    className="text-danger p-0 shadow-none"
                    onClick={(e) => handleDeleteClick(e, cls.id)}
                    title="حذف"
                  >
                    <MdDelete size={20} />
                  </Button>
                </div>
              </div>

              <CardBody className="pt-0 text-center d-flex flex-column align-items-center">
                <div className="display-6 mb-2 text-primary">
                  <MdClass />
                </div>
                <h4 className="fw-bold mb-3">{cls.title}</h4>

                <div className="mt-auto w-100 bg-light p-3 rounded-3 border d-flex justify-content-center align-items-center gap-2" style={{ minHeight: '60px' }}>
                  <MdPerson size={20} className="text-info" />
                  <span className="fw-bold small text-muted">
                    {getStudentCount(cls.id)} طلاب
                  </span>
                </div>
              </CardBody>
            </Card>
          </Col>
        ))}
        {classes?.length === 0 && (
          <Col xs="12" className="text-center py-5">
            <p className="text-muted fs-5">لا توجد صفوف مضافة حالياً.</p>
          </Col>
        )}
      </Row>

      <GenericModal
        isOpen={modalOpen}
        toggle={toggleModal}
        title={editingClass ? "تعديل بيانات الصف" : "إضافة صف جديد"}
        footer={
          <>
            <Button color="primary" onClick={handleSave}>
              حفظ
            </Button>{" "}
            <Button color="secondary" onClick={toggleModal}>
              إلغاء
            </Button>
          </>
        }
      >
        <Form>
          <FormGroup>
            <Label for="classTitle">اسم الصف</Label>
            <Input
              id="classTitle"
              value={classTitle}
              onChange={(e) => setClassTitle(e.target.value)}
              placeholder="مثال: الصف الأول"
            />
          </FormGroup>

          <FormGroup className="mt-3">
            <Label className="fw-bold mb-2">اختيار المواد الدراسية</Label>
            <div className="d-flex flex-wrap gap-2 p-3 bg-light rounded-3 border" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {allSubjects?.map((sub) => (
                <div key={sub.id} className="form-check form-check-inline m-0 p-2 rounded border" style={{ minWidth: '120px' }}>
                  <Input
                    type="checkbox"
                    id={`sub-${sub.id}`}
                    className="form-check-input ms-2"
                    checked={selectedSubjects.includes(sub.id)}
                    onChange={() => handleSubjectChange(sub.id)}
                  />
                  <Label className="form-check-label small fw-bold cursor-pointer" htmlFor={`sub-${sub.id}`} style={{ cursor: 'pointer' }}>
                    {sub.name}
                  </Label>
                </div>
              ))}
              {allSubjects?.length === 0 && <p className="text-muted small w-100 text-center">لا توجد مواد مضافة.</p>}
            </div>
          </FormGroup>
        </Form>
      </GenericModal>

      <ConfirmModal
        isOpen={confirmOpen}
        toggle={() => setConfirmOpen(!confirmOpen)}
        onConfirm={confirmDelete}
        title="حذف الصف"
        message="هل أنت متأكد من حذف هذا الصف؟ سيتم حذف جميع البيانات المرتبطة به."
      />
    </Container>
  );
};

export default Classes;
