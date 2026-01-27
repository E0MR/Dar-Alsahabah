import React from "react";
import { Table, Button } from "reactstrap";
import { FaEdit, FaTrash } from "react-icons/fa";

const DataTable = ({
    data,
    columns,
    onEdit,
    onDelete,
    keyField = "id",
    actionsLabel = "إجراءات",
    emptyMessage = "لا توجد بيانات"
}) => {
    return (
        <div className="table-responsive">
            <Table striped bordered hover className="text-center align-middle">
                <thead className="table-dark">
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index}>{col.label}</th>
                        ))}
                        {(onEdit || onDelete) && <th>{actionsLabel}</th>}
                    </tr>
                </thead>
                <tbody>
                    {data && data.length > 0 ? (
                        data.map((item, index) => (
                            <tr key={item[keyField]}>
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx}>
                                        {col.render ? col.render(item, index) : item[col.field]}
                                    </td>
                                ))}
                                {(onEdit || onDelete) && (
                                    <td>
                                        {onEdit && (
                                            <Button
                                                color="warning"
                                                size="sm"
                                                className="me-2"
                                                onClick={() => onEdit(item)}
                                            >
                                                <FaEdit />
                                            </Button>
                                        )}
                                        {onDelete && (
                                            <Button
                                                color="danger"
                                                size="sm"
                                                onClick={() => onDelete(item[keyField])}
                                            >
                                                <FaTrash />
                                            </Button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length + ((onEdit || onDelete) ? 1 : 0)} className="text-center">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    );
};

export default DataTable;
