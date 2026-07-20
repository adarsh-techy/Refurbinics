import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import useFetchList from '../../utils/use-fetch-list';
import DataTable from '../../components/ui/DataTable';
import TableState from '../../components/ui/TableState';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import AlertModal from '../../components/ui/AlertModal';
import Badge from '../../components/ui/Badge';
import RowActions from '../../components/ui/RowActions';
import apiClient from '../../services/api-client';
import { hasPermission } from '../../utils/permissions';
import PartForm from './PartForm';
import RestockForm from './RestockForm';

function PartsPage() {
  const { data, loading, error, refetch } = useFetchList('/parts');
  const user = useSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === 'super_admin';
  const canManageParts = hasPermission(user, 'parts');

  // null = closed, 'new' = create form, a part object = edit form
  const [formTarget, setFormTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [restockTarget, setRestockTarget] = useState(null);

  function handleSaved() {
    refetch();
    setFormTarget(null);
  }

  function handleRestocked() {
    refetch();
    setRestockTarget(null);
  }

  async function handleConfirmDelete() {
    setDeleteError(null);
    try {
      await apiClient.delete(`/parts/${deleteTarget.id}`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message);
      setDeleteTarget(null);
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Part',
      render: (row) => (
        <Link to={`/parts/${row.id}`} className="font-medium text-blue-700 hover:underline dark:text-blue-400">
          {row.name}
        </Link>
      ),
    },
    { key: 'sku', label: 'SKU', render: (row) => row.sku || '—' },
    { key: 'quantity', label: 'Qty' },
    {
      key: 'repair_cost',
      label: 'Repair Cost',
      render: (row) => `£${Number(row.repair_cost).toFixed(2)}`,
    },
    {
      key: 'in_stock',
      label: 'Status',
      render: (row) => (
        <Badge tone={row.in_stock ? 'good' : 'critical'}>
          {row.in_stock ? 'In Stock' : 'Out of Stock'}
        </Badge>
      ),
    },
    ...(canManageParts
      ? [
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setRestockTarget(row)}
                  className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
                >
                  Restock
                </button>
                {isSuperAdmin && (
                  <RowActions onEdit={() => setFormTarget(row)} onDelete={() => setDeleteTarget(row)} />
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Parts stock used for battery repairs."
        titleClassName="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400"
      >
        <Button variant="darkViolet" onClick={() => setFormTarget('new')}>+ Add Part</Button>
      </PageHeader>

      {formTarget && (
        <Modal
          title={formTarget === 'new' ? 'Add Part' : 'Edit Part'}
          description={
            formTarget === 'new' ? 'Add a new part to inventory.' : 'Update this part’s details.'
          }
          onClose={() => setFormTarget(null)}
        >
          <PartForm
            part={formTarget === 'new' ? null : formTarget}
            onSaved={handleSaved}
            onCancel={() => setFormTarget(null)}
          />
        </Modal>
      )}

      {restockTarget && (
        <Modal
          title="Restock Part"
          description={`Add stock for "${restockTarget.name}".`}
          onClose={() => setRestockTarget(null)}
        >
          <RestockForm part={restockTarget} onSaved={handleRestocked} onCancel={() => setRestockTarget(null)} />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Part"
          message={`Delete part "${deleteTarget.name}"? This can't be undone.`}
          requireTyping={false}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {deleteError && (
        <AlertModal title="Cannot Delete Part" message={deleteError} onClose={() => setDeleteError(null)} />
      )}

      {loading && <TableState>Loading…</TableState>}
      {error && <TableState tone="error">{error}</TableState>}
      {!loading && !error && <DataTable columns={columns} rows={data} headerColor="blue" showRowNumber />}
    </div>
  );
}

export default PartsPage;
