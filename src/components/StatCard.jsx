import { Col, Card, CardBody } from "reactstrap";

const StatCard = ({ icon, title, count }) => (
  <Col md="4">
    <Card className="text-center p-4 shadow-sm border-0 h-100 bg-card rounded-4 card-hover">
      <CardBody>
        <div style={{ fontSize: "3.5rem" }} className="mb-2">
          {icon}
        </div>
        <h3 className="fw-bold mb-3">{title}</h3>
        <h5 className="text-primary fw-bold fs-4">{count}</h5>
      </CardBody>
    </Card>
  </Col>
);

export default StatCard;
