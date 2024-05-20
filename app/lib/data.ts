import { unstable_noStore as noStore } from 'next/cache';
import { dbQuery } from './db/db';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';

export async function fetchRevenue() {
  noStore();
  try {
    const data = await dbQuery<Revenue[]>(`SELECT * FROM revenue`);
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  noStore();
  try {
    const data = await dbQuery<LatestInvoiceRaw[]>(`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`);

    const latestInvoices = data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  noStore();
  try {
    const invoiceCountPromise = dbQuery<Record<'COUNT(*)', number>[]>(
      `SELECT COUNT(*) FROM invoices`,
    );
    const customerCountPromise = dbQuery<Record<'COUNT(*)', number>[]>(
      `SELECT COUNT(*) FROM customers`,
    );
    const invoiceStatusPromise = dbQuery<
      Record<'paid' | 'pending', number>[]
    >(`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`);

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data?.[0]?.[0]?.['COUNT(*)'] ?? 0);
    const numberOfCustomers = Number(data?.[1]?.[0]?.['COUNT(*)'] ?? 0);
    const totalPaidInvoices = formatCurrency(data?.[2]?.[0]?.paid ?? 0);
    const totalPendingInvoices = formatCurrency(data?.[2]?.[0]?.pending ?? 0);

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  try {
    const invoices = await dbQuery<InvoicesTable[]>(`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name LIKE ${`"%${query}%"`} OR
        customers.email LIKE ${`"%${query}%"`} OR
        CAST(invoices.amount as TEXT) LIKE ${`"%${query}%"`} OR
        CAST(invoices.date as TEXT) LIKE ${`"%${query}%"`} OR
        invoices.status LIKE ${`"%${query}%"`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `);
    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  noStore();
  try {
    const [{ count }] = await dbQuery<
      [{ count: number }]
    >(`SELECT COUNT(*) as count
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name LIKE ${`"%${query}%"`} OR
      customers.email LIKE ${`"%${query}%"`} OR
      CAST(invoices.amount as TEXT) LIKE ${`"%${query}%"`} OR
      CAST(invoices.date as TEXT) LIKE ${`"%${query}%"`} OR
      invoices.status LIKE ${`"%${query}%"`}
  `);
    const totalPages = Math.ceil(count / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchCustomersPages(query: string) {
  noStore();
  try {
    const [{ count }] = await dbQuery<
      [{ count: number }]
    >(`SELECT COUNT(*) as count
    FROM customers
    WHERE
      customers.name LIKE ${`"%${query}%"`} OR
      customers.email LIKE ${`"%${query}%"`}
  `);
    const totalPages = Math.ceil(count / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of customers.');
  }
}

export async function fetchInvoiceById(id: number) {
  noStore();
  try {
    const data = await dbQuery<InvoiceForm[]>(`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `);

    const invoice = data.map((invoice) => ({
      ...invoice,
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  noStore();
  try {
    const data = await dbQuery<CustomerField[]>(`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `);

    const customers = data;
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(
  query: string,
  currentPage: number,
) {
  noStore();
  try {
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;
    const data = await dbQuery<CustomersTableType[]>(`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name LIKE ${`"%${query}%"`} OR
        customers.email LIKE ${`"%${query}%"`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `);

    const customers = data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}
