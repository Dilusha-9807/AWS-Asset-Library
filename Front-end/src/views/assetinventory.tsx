import React from "react";
import { Table } from "react-bootstrap";
import { useQuery } from "@tanstack/react-query";
import { getAssets } from "../api/assetInventory";

const columns = [
  {
    name: "INSTANCE NAME",
    selector: (row: any) => row.instance_name,
    sortable: true,
  },
  {
    name: "INSTANCE ID",
    selector: (row: any) => row.instance_id,
    sortable: true,
  },
  {
    name: "INSTANCE TYPE",
    selector: (row: any) => row.instance_type,
    sortable: true,
  },
  {
    name: "SERVER IP",
    selector: (row: any) => row.server_ip,
    sortable: true,
  },
  {
    name: "ENVIRONMENT",
    selector: (row: any) => row.environment,
    sortable: true,
  },
  {
    name: "REGION",
    selector: (row: any) => row.region,
    sortable: true,
  },
  {
    name: "ACCOUNT",
    selector: (row: any) => row.account,
    sortable: true,
  },
  {
    name: "BACKUP STATUS",
    selector: (row: any) => row.backup_status,
    sortable: true,
  },
  {
    name: "EDB STATUS",
    selector: (row: any) => row.edb_status,
    sortable: true,
  },
];

const AssetInventoryPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: getAssets,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Assets Inventory</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.name}>{column.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data?.map((row) => (
            <tr key={row.instance_id}>
              {columns.map((column) => (
                <td key={column.name}>{row[column.name]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AssetInventoryPage;