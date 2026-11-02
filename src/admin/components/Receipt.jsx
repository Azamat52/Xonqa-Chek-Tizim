import { saleDate } from "@/admin/lib/sale-details";
import { unitLabel } from "@/admin/lib/units";

const money = (value) =>
  Math.round(Number(value) || 0).toLocaleString("ru-RU");

const quantity = (value) =>
  Number(value || 0).toLocaleString("ru-RU", {
    maximumFractionDigits: 2,
  });

const getItemTotal = (item) =>
  Math.round(
    (Number(item.qty) || 0) * (Number(item.price) || 0),
  );

const getUnitPriceLabel = (item) => {
  const unit = unitLabel(item.unit);
  return `${money(item.price)} (1 ${unit})`;
};

export default function Receipt({ sale }) {
  if (!sale) return null;

  return (
    <div id="pos-receipt" className="receipt-print">
      <header className="receipt-heading">
        <h1>{sale.seller || "Xonqa"}</h1>

        <p>{saleDate(sale.createdAt)}</p>

        <b className="receipt-id">
          Chek №: {sale.id}
        </b>
      </header>

      <div className="receipt-info">
        <p title={`Sotuvchi: ${sale.seller || "Xonqa"}`}>
          Sotuvchi: <b>{sale.seller || "Xonqa"}</b>
        </p>

        {sale.customer && (
          <p title={`Mijoz: ${sale.customer}`}>
            Mijoz: <b>{sale.customer}</b>
          </p>
        )}

        {sale.name && (
          <p title={`Savdo: ${sale.name}`}>
            Savdo: <b>{sale.name}</b>
          </p>
        )}

        {sale.phone && (
          <p title={`Telefon: ${sale.phone}`}>
            Telefon: <b>{sale.phone}</b>
          </p>
        )}

        {sale.address && (
          <p title={`Manzil: ${sale.address}`}>
            Manzil: <b>{sale.address}</b>
          </p>
        )}
      </div>

      <table className="receipt-table">
        <colgroup>
          <col className="receipt-name" />
          <col className="receipt-qty" />
          <col className="receipt-price" />
          <col className="receipt-total-column" />
        </colgroup>

        <thead>
          <tr>
            <th>Nomi</th>
            <th>Miqdor</th>
            <th>Narxi</th>
            <th>Jami</th>
          </tr>
        </thead>

        <tbody>
          {(sale.items || []).map((item, index) => {
            const unit = unitLabel(item.unit);
            const itemName = `${index + 1}. ${item.name || "Mahsulot"}`;
            const itemQuantity = `${quantity(item.qty)} ${unit}`;
            const unitPrice = getUnitPriceLabel(item);
            const itemTotal = getItemTotal(item);

            return (
              <tr key={item.id || index}>
                <td>
                  <span
                    className="receipt-cell-line"
                    title={itemName}
                  >
                    {itemName}
                  </span>
                </td>

                <td>
                  <span
                    className="receipt-cell-line receipt-quantity"
                    title={itemQuantity}
                  >
                    {itemQuantity}
                  </span>
                </td>

                <td>
                  <span
                    className="receipt-cell-line receipt-unit-price"
                    title={`${money(item.price)} so'm / ${unit}`}
                  >
                    {unitPrice}
                  </span>
                </td>

                <td>
                  <span
                    className="receipt-cell-line receipt-item-total"
                    title={`${money(itemTotal)} so'm`}
                  >
                    {money(itemTotal)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="receipt-total">
        <b>JAMI:</b>

        <b>{money(sale.total)} so'm</b>
      </div>

      <p className="receipt-thanks">
        Xaridingiz uchun rahmat!
      </p>

      <div className="receipt-end" aria-hidden="true">
        {"*".repeat(150)}
      </div>
    </div>
  );
}
