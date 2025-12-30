document.addEventListener('DOMContentLoaded', async () => {
  const status = document.getElementById('status');
  const tbody = document.querySelector('#items-table tbody');
  try {
    const res = await fetch('/items');
    const items = await res.json();
    status.textContent = `Loaded ${items.length} items`;
    tbody.innerHTML = items.map(it => `
      <tr>
        <td>${it._id}</td>
        <td><pre>${JSON.stringify(it, null, 2)}</pre></td>
        <td>${new Date(it.createdAt).toLocaleString()}</td>
      </tr>
    `).join('');
  } catch (err) {
    status.textContent = 'Failed to load items';
  }
});
