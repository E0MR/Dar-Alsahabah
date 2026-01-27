import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    Button,
    Table,
    Form,
    FormGroup,
    Label,
    Input,
    Badge,
} from "reactstrap";
import {
    MdArrowBack,
    MdPerson,
    MdPrint,
    MdSettings,
    MdEdit,
    MdDelete,
    MdOutlineDescription
} from "react-icons/md";
import { useReactToPrint } from "react-to-print";
import GenericModal from "../components/common/GenericModal";
import ConfirmModal from "../components/common/ConfirmModal";
import { useSession } from "../context/SessionContext";

const ClassDetails = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { sessions, activeSessionId } = useSession();
    const activeSession = sessions.find(s => s.id === activeSessionId);

    const id = parseInt(classId);

    // --- Queries ---
    const cls = useLiveQuery(() => db.classes.get(id), [id]);
    const students = useLiveQuery(
        () => db.students.where({ classId: classId }).toArray(),
        [classId]
    );
    const allSubjects = useLiveQuery(() => db.subjects.toArray());
    const grades = useLiveQuery(
        () => db.grades.where({ sessionId: activeSessionId }).toArray(),
        [activeSessionId]
    );

    // --- State ---
    const [subjectModal, setSubjectModal] = useState(false);
    const [selectedSubjects, setSelectedSubjects] = useState([]);

    // Student Edit/Delete State (Local to this page for quick actions)
    const [studentModal, setStudentModal] = useState(false);
    const [studentForm, setStudentForm] = useState({ name: "", phone1: "", phone2: "" });
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [targetStudentId, setTargetStudentId] = useState(null);

    // Printing
    const tableRef = useRef();
    const [isPrintingEmpty, setIsPrintingEmpty] = useState(false);

    const certsRef = useRef();

    const handlePrintCertificates = useReactToPrint({
        contentRef: certsRef,
        documentTitle: `Certs_${activeSession?.title || 'General'}_${cls?.title}`,
        pageStyle: `
            @page { size: A4 portrait; margin: 10mm; }
            @media print {
                body { background: white !important; }
                .cert-container { 
                    page-break-inside: avoid; 
                    height: 32vh; 
                    border-bottom: 2px dashed #999; 
                    padding: 15px; 
                    position: relative;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .cert-container:nth-child(3n) { 
                    page-break-after: always; 
                    border-bottom: none; 
                }
                .cert-container table td, .cert-container table th {
                    vertical-align: middle !important;
                    text-align: center !important;
                }
            }
        `
    });

    const handlePrint = useReactToPrint({
        contentRef: tableRef,
        documentTitle: `P_Sheet_${cls?.title || 'Class'}`,
        pageStyle: `@page { size: A4 landscape; margin: 10mm; }`,
        onAfterPrint: () => setIsPrintingEmpty(false)
    });

    const handlePrintEmpty = () => {
        setIsPrintingEmpty(true);
        setTimeout(() => {
            handlePrint();
        }, 100);
    };

    // --- Derived Data ---
    if (!cls || !students || !allSubjects || !grades) return <div className="p-5 text-center">جاري التحميل...</div>;

    const classSubjects = allSubjects.filter(s => cls.subjectIds?.includes(s.id));
    const basicSubjects = classSubjects.filter(s => s.isMain);
    const additionalSubjects = classSubjects.filter(s => !s.isMain);

    // --- Handlers ---
    const openSubjectModal = () => {
        setSelectedSubjects(cls.subjectIds || []);
        setSubjectModal(true);
    };

    const handleSaveSubjects = async () => {
        await db.classes.update(id, { subjectIds: selectedSubjects });
        setSubjectModal(false);
    };

    const handleSubjectChange = (subjectId) => {
        setSelectedSubjects((prev) =>
            prev.includes(subjectId)
                ? prev.filter((id) => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    // Student CRUD (Quick)
    const handleEditStudent = (st) => {
        setStudentForm(st);
        setStudentModal(true);
    };

    const handleSaveStudent = async () => {
        await db.students.update(studentForm.id, studentForm);
        setStudentModal(false);
    };

    const handleDeleteStudent = (sid) => {
        setTargetStudentId(sid);
        setConfirmOpen(true);
    };

    const confirmDeleteStudent = async () => {
        await db.students.delete(targetStudentId);
        // Clean up grades for this student
        await db.grades.where({ studentId: targetStudentId }).delete();
    };

    // --- Helper to get grade ---
    const getGrade = (studentId, subjectId, paper = null) => {
        // Find grades for this student and subject
        const studentGrades = grades.filter(g => g.studentId === studentId && g.subjectId === subjectId);

        // If query specific paper
        if (paper) {
            const grade = studentGrades.find(g => g.paper === paper);
            return grade ? grade.score : "";
        }

        // If no paper specified (simple subject), return first score or sum? 
        // For simple subjects, we assume just one entry or paper=null
        const grade = studentGrades.find(g => !g.paper);
        return grade ? grade.score : "";
    };

    const handleGradeChange = async (studentId, subjectId, value, paper = null) => {
        const score = parseFloat(value);
        if (isNaN(score)) {
            // If empty or invalid, maybe delete? For now just ignore or save null
            if (value === "") {
                // Find and delete
                if (paper) {
                    await db.grades.where({ studentId, subjectId, paper, sessionId: activeSessionId }).delete();
                } else {
                    await db.grades.where({ studentId, subjectId, sessionId: activeSessionId }).delete();
                }
            }
            return;
        }

        // Check if grade exists for THIS student, THIS subject, and THIS session
        let collection = db.grades.where({ sessionId: activeSessionId, studentId, subjectId });
        if (paper) {
            collection = collection.filter(g => g.paper === paper);
        } else {
            // For simple subjects, we usually don't have a paper property or it's null
            collection = collection.filter(g => !g.paper);
        }

        const existing = await collection.first();

        if (existing) {
            await db.grades.update(existing.id, { score });
        } else {
            await db.grades.add({
                studentId,
                subjectId,
                score,
                paper, // can be null or 1/2
                sessionId: activeSessionId
            });
        }
    };

    // --- Certificate Calculation Logic ---
    const studentStats = (students || []).map(st => {
        let total = 0;
        basicSubjects.forEach(sub => {
            if (sub.paperCount === 2) {
                const g1 = getGrade(st.id, sub.id, 1);
                const g2 = getGrade(st.id, sub.id, 2);
                if (g1) total += Number(g1);
                if (g2) total += Number(g2);
            } else {
                const g = getGrade(st.id, sub.id);
                if (g) total += Number(g);
            }
        });
        return { ...st, total };
    });

    // Sort by total descending to find top 3
    const sortedStats = [...studentStats].sort((a, b) => b.total - a.total);

    // Total Max Grade Calculation
    const totalMaxGrade = basicSubjects.reduce((sum, s) => sum + (s.maxGrade || 0), 0) +
        additionalSubjects.reduce((sum, s) => sum + (s.maxGrade || 0), 0);

    const getRankIcon = (studentId) => {
        const index = sortedStats.findIndex(s => s.id === studentId);
        if (index === 0) return "🥇";
        if (index === 1) return "🥈";
        if (index === 2) return "🥉";
        return null;
    };

    const getRankText = (studentId) => {
        const index = sortedStats.findIndex(s => s.id === studentId);
        if (index === 0) return "المركز الأول";
        if (index === 1) return "المركز الثاني";
        if (index === 2) return "المركز الثالث";
        return "";
    };

    return (
        <Container fluid className="p-3 p-md-4">
            {/* Header & Toolbar */}
            <Row className="mb-4">
                <Col className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <Button
                            color="light"
                            className="rounded-circle shadow-sm"
                            onClick={() => navigate("/classes")}
                        >
                            <MdArrowBack size={22} />
                        </Button>
                        <div>
                            <h2 className="text-primary fw-bold mb-0 d-flex align-items-center gap-2">
                                فصل: {cls.title}
                            </h2>
                            <span className="text-muted small">{students.length} طالب • {classSubjects.length} مادة</span>
                        </div>
                    </div>

                    <div className="d-flex gap-2">
                        <Button
                            color="warning"
                            outline
                            className="rounded-pill px-3 shadow-sm border-0 d-flex align-items-center gap-2 bg-white"
                            style={{ minWidth: '160px', justifyContent: 'center' }}
                            onClick={openSubjectModal}
                        >
                            <MdSettings size={18} /> اختيار المواد
                        </Button>
                        <Button
                            color="dark"
                            className="rounded-pill px-3 shadow-sm d-flex align-items-center gap-2"
                            style={{ minWidth: '160px', justifyContent: 'center' }}
                            onClick={handlePrintEmpty}
                        >
                            <MdOutlineDescription size={20} /> كشف الرصد
                        </Button>
                        <Button
                            color="primary"
                            className="rounded-pill px-3 shadow-sm d-flex align-items-center gap-2"
                            style={{ minWidth: '160px', justifyContent: 'center' }}
                            onClick={handlePrintCertificates}
                        >
                            <MdPrint size={20} /> استخراج الشهادات
                        </Button>
                    </div>
                </Col>
            </Row>

            {/* Grade Sheet Table */}
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <CardBody className="p-0">
                    <div className={`table-responsive ${isPrintingEmpty ? 'print-empty-grades' : ''}`} ref={tableRef}>
                        <div className="d-none d-print-block text-center mb-4 pt-4">
                            <h2>كشف درجات فصل: {cls.title}</h2>
                        </div>
                        <Table bordered hover className="text-center align-middle mb-0 table-fixed" style={{ minWidth: '1000px' }}>
                            <thead className="table-dark text-white text-center align-middle">
                                <tr>
                                    <th rowSpan="2" style={{ width: '50px' }}>م</th>
                                    <th rowSpan="2" style={{ width: '200px' }}>اسم الطالب</th>
                                    {basicSubjects.map(sub => (
                                        <th
                                            key={sub.id}
                                            colSpan={sub.paperCount === 2 ? 2 : 1}
                                            rowSpan={sub.paperCount === 2 ? 1 : 2}
                                            className="bg-primary py-1"
                                        >
                                            <div>{sub.name}</div>
                                            <div style={{ fontSize: '0.8em', opacity: 0.9 }}>({sub.maxGrade || '-'})</div>
                                        </th>
                                    ))}
                                    <th rowSpan="2" style={{ width: '80px' }} className="bg-success">المجموع</th>
                                    {additionalSubjects.map(sub => (
                                        <th
                                            key={sub.id}
                                            colSpan={sub.paperCount === 2 ? 2 : 1}
                                            rowSpan={sub.paperCount === 2 ? 1 : 2}
                                            className="bg-secondary py-1"
                                        >
                                            <div>{sub.name}</div>
                                            <div style={{ fontSize: '0.8em', opacity: 0.9 }}>({sub.maxGrade || '-'})</div>
                                        </th>
                                    ))}
                                    <th rowSpan="1" colSpan="2" style={{ width: '100px' }} className="d-print-none bg-dark text-white">
                                        <MdSettings size={20} />
                                    </th>
                                </tr>
                                <tr>
                                    {/* Basic Subjects Sub-headers (only for 2-paper subjects) */}
                                    {basicSubjects.map(sub => (
                                        sub.paperCount === 2 ? (
                                            <React.Fragment key={sub.id}>
                                                <th className="small bg-primary bg-opacity-75 py-1" style={{ width: '80px' }}>{sub.paper1Name || 'ورقة 1'}</th>
                                                <th className="small bg-primary bg-opacity-75 py-1" style={{ width: '80px' }}>{sub.paper2Name || 'ورقة 2'}</th>
                                            </React.Fragment>
                                        ) : null
                                    ))}

                                    {/* Additional Subjects Sub-headers */}
                                    {additionalSubjects.map(sub => (
                                        sub.paperCount === 2 ? (
                                            <React.Fragment key={sub.id}>
                                                <th className="small bg-secondary bg-opacity-75 py-1" style={{ width: '80px' }}>{sub.paper1Name || 'ورقة 1'}</th>
                                                <th className="small bg-secondary bg-opacity-75 py-1" style={{ width: '80px' }}>{sub.paper2Name || 'ورقة 2'}</th>
                                            </React.Fragment>
                                        ) : null
                                    ))}

                                    {/* Actions Sub-headers */}
                                    <th className="d-print-none bg-light text-dark small py-1" style={{ width: '50px' }}>تعديل</th>
                                    <th className="d-print-none bg-light text-dark small py-1" style={{ width: '50px' }}>حذف</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentStats.map((st, idx) => {
                                    return (
                                        <tr key={st.id}>
                                            <td>{idx + 1}</td>
                                            <td className="fw-bold text-start ps-3 text-truncate">{st.name}</td>

                                            {/* Basic Subjects Grades */}
                                            {basicSubjects.map(sub => {
                                                if (sub.paperCount === 2) {
                                                    const g1 = getGrade(st.id, sub.id, 1);
                                                    const g2 = getGrade(st.id, sub.id, 2);
                                                    return (
                                                        <React.Fragment key={sub.id}>
                                                            <td className="p-0"><input className="grade-input" defaultValue={g1} onBlur={(e) => handleGradeChange(st.id, sub.id, e.target.value, 1)} /></td>
                                                            <td className="p-0"><input className="grade-input" defaultValue={g2} onBlur={(e) => handleGradeChange(st.id, sub.id, e.target.value, 2)} /></td>
                                                        </React.Fragment>
                                                    );
                                                } else {
                                                    const g = getGrade(st.id, sub.id);
                                                    return <td key={sub.id} className="p-0"><input className="grade-input" defaultValue={g} onBlur={(e) => handleGradeChange(st.id, sub.id, e.target.value)} /></td>;
                                                }
                                            })}

                                            <td className="fw-bold bg-light">{st.total}</td>

                                            {/* Additional Subjects Grades */}
                                            {additionalSubjects.map(sub => {
                                                if (sub.paperCount === 2) {
                                                    const g1 = getGrade(st.id, sub.id, 1);
                                                    const g2 = getGrade(st.id, sub.id, 2);
                                                    return (
                                                        <React.Fragment key={sub.id}>
                                                            <td className="p-0"><input className="grade-input" defaultValue={g1} onBlur={(e) => handleGradeChange(st.id, sub.id, e.target.value, 1)} /></td>
                                                            <td className="p-0"><input className="grade-input" defaultValue={g2} onBlur={(e) => handleGradeChange(st.id, sub.id, e.target.value, 2)} /></td>
                                                        </React.Fragment>
                                                    );
                                                } else {
                                                    const g = getGrade(st.id, sub.id);
                                                    return <td key={sub.id} className="p-0"><input className="grade-input" defaultValue={g} onBlur={(e) => handleGradeChange(st.id, sub.id, e.target.value)} /></td>;
                                                }
                                            })}

                                            <td className="d-print-none p-0">
                                                <Button size="sm" color="link" className="text-info w-100 h-100" onClick={() => handleEditStudent(st)}><MdEdit size={18} /></Button>
                                            </td>
                                            <td className="d-print-none p-0">
                                                <Button size="sm" color="link" className="text-danger w-100 h-100" onClick={() => handleDeleteStudent(st.id)}><MdDelete size={18} /></Button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </Table>
                    </div>
                </CardBody>
            </Card>

            {/* --- Modals --- */}

            {/* Subject Management Modal */}
            <GenericModal
                isOpen={subjectModal}
                toggle={() => setSubjectModal(!subjectModal)}
                title="تعديل مواد الفصل"
                footer={
                    <>
                        <Button color="primary" onClick={handleSaveSubjects}>حفظ التغييرات</Button>
                        <Button color="secondary" onClick={() => setSubjectModal(false)}>إلغاء</Button>
                    </>
                }
            >
                <div className="d-flex flex-wrap gap-2 p-2">
                    {allSubjects?.map((sub) => (
                        <div key={sub.id} className="form-check form-check-inline m-0 bg-light p-2 rounded border" style={{ minWidth: '130px' }}>
                            <Input
                                type="checkbox"
                                id={`d-sub-${sub.id}`}
                                className="form-check-input ms-2"
                                checked={selectedSubjects.includes(sub.id)}
                                onChange={() => handleSubjectChange(sub.id)}
                            />
                            <Label className="form-check-label small fw-bold cursor-pointer" htmlFor={`d-sub-${sub.id}`} style={{ cursor: 'pointer' }}>
                                {sub.name}
                            </Label>
                        </div>
                    ))}
                </div>
            </GenericModal>

            {/* Quick Edit Student Modal */}
            <GenericModal
                isOpen={studentModal}
                toggle={() => setStudentModal(false)}
                title="تعديل بيانات الطالب"
                footer={<><Button color="primary" onClick={handleSaveStudent}>حفظ</Button></>}
            >
                <Form>
                    <FormGroup>
                        <Label>الاسم</Label>
                        <Input value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} />
                    </FormGroup>
                    <Row>
                        <Col md={6}>
                            <FormGroup>
                                <Label>رقم ولي الأمر 1</Label>
                                <Input value={studentForm.phone1 || ''} onChange={e => setStudentForm({ ...studentForm, phone1: e.target.value })} />
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label>رقم ولي الأمر 2</Label>
                                <Input value={studentForm.phone2 || ''} onChange={e => setStudentForm({ ...studentForm, phone2: e.target.value })} />
                            </FormGroup>
                        </Col>
                    </Row>
                    <FormGroup>
                        <Label>ملاحظات</Label>
                        <Input type="textarea" value={studentForm.notes || ''} onChange={e => setStudentForm({ ...studentForm, notes: e.target.value })} />
                    </FormGroup>
                </Form>
            </GenericModal>

            <ConfirmModal
                isOpen={confirmOpen}
                toggle={() => setConfirmOpen(!confirmOpen)}
                onConfirm={confirmDeleteStudent}
                title="حذف الطالب"
            />

            {/* --- Hidden Certificate Component --- */}
            <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', width: '210mm' }}>
                <div ref={certsRef} className="print-certs">
                    {sortedStats.map((st) => (
                        <div key={st.id} className="cert-container d-flex flex-column justify-content-between text-black">
                            {/* Top Section */}
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                {/* Left: Dar Name */}
                                <div className="text-start fw-bold fs-5" style={{ width: '150px' }}>
                                    دار الصحابة
                                </div>

                                {/* Center: Exam Name */}
                                <div className="text-center pt-2">
                                    <h3 className="fw-bold mb-0">{activeSession ? activeSession.title : `اختبار ${cls.title}`}</h3>
                                </div>

                                {/* Right: Rank Icon & Text */}
                                <div style={{ width: '150px', fontSize: '18px' }} className="text-end fw-bold">
                                    {getRankIcon(st.id)} {getRankText(st.id)}
                                </div>
                            </div>

                            {/* Student Info */}
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="fw-bold" style={{ fontSize: '2.2em' }}>الطالب: {st.name}</span>
                                <span className="fw-bold fs-4">الفصل: {cls.title}</span>
                            </div>

                            {/* Marks Table */}
                            <table className="table table-bordered border-dark text-center mb-0" style={{ fontSize: '12px' }}>
                                <thead>
                                    <tr className="bg-light">
                                        <td>المادة</td>
                                        {basicSubjects.map(s => <td key={s.id}>{s.name}</td>)}
                                        <td className="bg-success text-white">المجموع</td>
                                        {additionalSubjects.map(s => <td key={s.id}>{s.name}</td>)}
                                    </tr>
                                    <tr>
                                        <td>العظمى</td>
                                        {basicSubjects.map(s => <td key={s.id}>{s.maxGrade}</td>)}
                                        <td className="bg-light">{totalMaxGrade}</td>
                                        {additionalSubjects.map(s => <td key={s.id}>{s.maxGrade}</td>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>الدرجة</td>
                                        {basicSubjects.map(s => {
                                            const totalSub1 = getGrade(st.id, s.id, 1) ? Number(getGrade(st.id, s.id, 1)) : 0;
                                            const totalSub2 = getGrade(st.id, s.id, 2) ? Number(getGrade(st.id, s.id, 2)) : 0;
                                            const final = s.paperCount === 2 ? totalSub1 + totalSub2 : (getGrade(st.id, s.id) || 0);
                                            return <td key={s.id}>{final}</td>
                                        })}
                                        <td className="fw-bold">{st.total}</td>
                                        {additionalSubjects.map(s => {
                                            const totalSub1 = getGrade(st.id, s.id, 1) ? Number(getGrade(st.id, s.id, 1)) : 0;
                                            const totalSub2 = getGrade(st.id, s.id, 2) ? Number(getGrade(st.id, s.id, 2)) : 0;
                                            const final = s.paperCount === 2 ? totalSub1 + totalSub2 : (getGrade(st.id, s.id) || 0);
                                            return <td key={s.id}>{final}</td>
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                            {/* Signature / Footer spacing */}
                            <div className="mt-2 text-center text-muted small">
                                مع تمنياتنا بالتوفيق
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Container>
    );
};


export default ClassDetails;
