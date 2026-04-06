let data = { lists: [] };
let consent = null;
let draggedElement = null;

function loadData() {
    consent = localStorage.getItem('consent');
    if (consent === 'yes') {
        const stored = localStorage.getItem('listAppData');
        if (stored) {
            data = JSON.parse(stored);
        }
    } else if (consent === 'no') {
        data = { lists: [] };
    }
}

function saveData() {
    if (consent === 'yes') {
        localStorage.setItem('listAppData', JSON.stringify(data));
    }
}

function renderLists() {
    const container = document.getElementById('lists-container');
    const addPlaceholder = document.getElementById('add-list-placeholder');
    container.innerHTML = '';
    container.appendChild(addPlaceholder);

    data.lists.forEach((list) => {
        const listDiv = document.createElement('div');
        listDiv.className = 'list rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/30';
        listDiv.dataset.id = list.id;
        listDiv.innerHTML = `
            <div class="mb-4 flex items-start justify-between gap-4">
                <h2 class="flex-1 min-w-0 text-xl font-semibold text-slate-900" contenteditable="true" data-id="${list.id}">${list.name}</h2>
                <button class="delete-btn rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:border-red-400 hover:text-red-600" data-id="${list.id}" title="Delete list">&#128465;</button>
            </div>
            <div id="delete-confirm-${list.id}" class="delete-confirmation hidden">
                <p class="mb-3">Delete this list and all items?</p>
                <div class="flex gap-3">
                    <button class="confirm-delete-list rounded-full border border-red-400 bg-red-100 px-4 py-2 text-sm text-red-800" data-id="${list.id}">Yes</button>
                    <button class="cancel-delete-list rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-700" data-id="${list.id}">Cancel</button>
                </div>
            </div>
            <ul class="space-y-3" data-list-id="${list.id}">
                ${list.items.map(item => `
                    <li class="item flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" draggable="true" data-list-id="${list.id}" data-item-id="${item.id}">
                        <span class="item-text flex-1 min-w-0 text-slate-900" contenteditable="true" data-list-id="${list.id}" data-item-id="${item.id}">${item.text}</span>
                        <button class="delete-btn rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:border-red-400 hover:text-red-600" data-list-id="${list.id}" data-item-id="${item.id}" title="Delete item">&#128465;</button>
                    </li>
                `).join('')}
                <li class="add-item-placeholder rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-slate-500 transition hover:border-slate-400 hover:bg-slate-100" contenteditable="true" data-list-id="${list.id}">Click to add new item</li>
            </ul>
        `;
        container.appendChild(listDiv);
    });
}

function addList(name) {
    const id = Date.now();
    data.lists.unshift({ id, name, items: [] });
    saveData();
    renderLists();
    focusNewItemPlaceholder(id);
}

function editList(id, newName) {
    const list = data.lists.find(l => l.id == id);
    if (list) {
        list.name = newName;
        saveData();
    }
}

function deleteList(id) {
    data.lists = data.lists.filter(l => l.id != id);
    saveData();
    renderLists();
}

function addItem(listId, text) {
    const list = data.lists.find(l => l.id == listId);
    if (list) {
        const id = Date.now();
        list.items.push({ id, text });
        saveData();
        renderLists();
        focusNewItemPlaceholder(listId);
    }
}

function focusNewItemPlaceholder(listId) {
    const placeholder = document.querySelector(`.add-item-placeholder[data-list-id="${listId}"]`);
    if (placeholder) {
        placeholder.textContent = '';
        placeholder.contentEditable = 'true';
        placeholder.focus();
    }
}

function editItem(listId, itemId, newText) {
    const list = data.lists.find(l => l.id == listId);
    if (list) {
        const item = list.items.find(i => i.id == itemId);
        if (item) {
            item.text = newText;
            saveData();
        }
    }
}

function deleteItem(listId, itemId) {
    const list = data.lists.find(l => l.id == listId);
    if (list) {
        list.items = list.items.filter(i => i.id != itemId);
        saveData();
        renderLists();
    }
}

function reorderLists(fromIndex, toIndex) {
    const [moved] = data.lists.splice(fromIndex, 1);
    data.lists.splice(toIndex, 0, moved);
    saveData();
    renderLists();
}

function showConsentModal() {
    document.getElementById('consent-modal').style.display = 'block';
}

function hideConsentModal() {
    document.getElementById('consent-modal').style.display = 'none';
}

function showSettingsModal() {
    document.getElementById('current-consent').textContent = consent === 'yes' ? 'Accepted' : 'Declined';
    document.getElementById('settings-modal').style.display = 'block';
}

function hideSettingsModal() {
    document.getElementById('settings-modal').style.display = 'none';
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    consent = localStorage.getItem('consent');
    if (consent === null) {
        showConsentModal();
    } else {
        loadData();
        renderLists();
    }

    document.getElementById('accept-consent').addEventListener('click', () => {
        localStorage.setItem('consent', 'yes');
        consent = 'yes';
        hideConsentModal();
        loadData();
        renderLists();
    });

    document.getElementById('decline-consent').addEventListener('click', () => {
        localStorage.setItem('consent', 'no');
        consent = 'no';
        data = { lists: [] };
        hideConsentModal();
        renderLists();
    });

    document.getElementById('storage-settings').addEventListener('click', showSettingsModal);

    document.getElementById('change-consent').addEventListener('click', () => {
        if (consent === 'yes') {
            localStorage.setItem('consent', 'no');
            consent = 'no';
            data = { lists: [] };
            localStorage.removeItem('listAppData');
        } else {
            localStorage.setItem('consent', 'yes');
            consent = 'yes';
            loadData();
        }
        hideSettingsModal();
        renderLists();
    });

    document.getElementById('close-settings').addEventListener('click', hideSettingsModal);

    // Add list placeholder
    document.getElementById('add-list-placeholder').addEventListener('click', function() {
        this.contentEditable = 'true';
        this.textContent = '';
        this.focus();
    });

    document.getElementById('add-list-placeholder').addEventListener('blur', function() {
        const name = this.textContent.trim();
        if (name) {
            addList(name);
            this.textContent = 'Click to add new list';
        } else {
            this.textContent = 'Click to add new list';
        }
        this.contentEditable = 'false';
    });

    document.getElementById('add-list-placeholder').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.blur();
        }
    });

    document.getElementById('lists-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            if (e.target.dataset.id && !e.target.dataset.listId) {
                const confirmBox = document.getElementById(`delete-confirm-${e.target.dataset.id}`);
                if (confirmBox) {
                    confirmBox.classList.toggle('hidden');
                }
            } else if (e.target.dataset.listId && e.target.dataset.itemId) {
                deleteItem(e.target.dataset.listId, e.target.dataset.itemId);
            }
        } else if (e.target.classList.contains('confirm-delete-list')) {
            deleteList(e.target.dataset.id);
        } else if (e.target.classList.contains('cancel-delete-list')) {
            const confirmBox = document.getElementById(`delete-confirm-${e.target.dataset.id}`);
            if (confirmBox) {
                confirmBox.classList.add('hidden');
            }
        } else if (e.target.classList.contains('add-item-placeholder')) {
            e.target.contentEditable = 'true';
            e.target.textContent = '';
            e.target.focus();
        } else {
            const itemRow = e.target.closest('.item');
            if (itemRow && !e.target.classList.contains('delete-btn')) {
                const field = itemRow.querySelector('.item-text');
                if (field) {
                    field.focus();
                }
            }
        }
    });

    document.getElementById('lists-container').addEventListener('blur', (e) => {
        if (e.target.tagName === 'H2' && e.target.contentEditable === 'true') {
            const id = e.target.dataset.id;
            const newName = e.target.textContent.trim();
            if (newName) {
                editList(id, newName);
            } else {
                e.target.textContent = data.lists.find(l => l.id == id).name;
            }
        } else if (e.target.classList.contains('item-text')) {
            const listId = e.target.dataset.listId;
            const itemId = e.target.dataset.itemId;
            const newText = e.target.textContent.trim();
            if (newText) {
                editItem(listId, itemId, newText);
            } else {
                e.target.textContent = data.lists.find(l => l.id == listId).items.find(i => i.id == itemId).text;
            }
        } else if (e.target.classList.contains('add-item-placeholder')) {
            const listId = e.target.dataset.listId;
            const text = e.target.textContent.trim();
            if (text) {
                addItem(listId, text);
            } else {
                e.target.textContent = 'Click to add new item';
            }
            e.target.contentEditable = 'false';
        }
    }, true);

    document.getElementById('lists-container').addEventListener('keydown', (e) => {
        if (e.target.contentEditable === 'true' && e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        }
    });

    document.getElementById('lists-container').addEventListener('dragstart', (e) => {
        const item = e.target.closest('.item');
        if (item) {
            draggedElement = item;
            item.classList.add('dragging');
        }
    });

    document.getElementById('lists-container').addEventListener('dragend', () => {
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
            draggedElement = null;
        }
    });

    document.getElementById('lists-container').addEventListener('dragover', (e) => {
        e.preventDefault();
        const list = e.target.closest('ul[data-list-id]');
        if (!list || !draggedElement) {
            return;
        }
        const afterElement = getDragAfterItem(list, e.clientY);
        const placeholder = list.querySelector('.add-item-placeholder');
        if (afterElement == null) {
            if (placeholder) {
                list.insertBefore(draggedElement, placeholder);
            } else {
                list.appendChild(draggedElement);
            }
        } else {
            list.insertBefore(draggedElement, afterElement);
        }
    });

    document.getElementById('lists-container').addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedElement) {
            return;
        }
        const list = draggedElement.closest('ul[data-list-id]');
        if (!list) {
            return;
        }
        const listId = list.dataset.listId;
        const itemOrder = [...list.querySelectorAll('.item')].map(item => item.dataset.itemId);
        const targetList = data.lists.find(l => l.id == listId);
        if (targetList) {
            targetList.items.sort((a, b) => itemOrder.indexOf(a.id.toString()) - itemOrder.indexOf(b.id.toString()));
            saveData();
        }
    });

    function getDragAfterItem(container, y) {
        const draggableElements = [...container.querySelectorAll('.item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
});