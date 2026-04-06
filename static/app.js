let data = { lists: [], deletedItems: [] };
let consent = null;
let draggedElement = null;
let showAllDeleted = {};
let currentStyleListId = null;

function loadData() {
    consent = localStorage.getItem('consent');
    if (consent === 'yes') {
        const stored = localStorage.getItem('listAppData');
        if (stored) {
            data = JSON.parse(stored);
        }
    } else if (consent === 'no') {
        data = { lists: [], deletedItems: [] };
    }
    data.deletedItems = data.deletedItems || [];
}

function saveData() {
    if (consent === 'yes') {
        localStorage.setItem('listAppData', JSON.stringify(data));
    }
}

function lightenHexColor(hex, percent) {
    const normalized = hex.replace('#', '');
    const num = parseInt(normalized, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    const newR = Math.round(r + (255 - r) * percent);
    const newG = Math.round(g + (255 - g) * percent);
    const newB = Math.round(b + (255 - b) * percent);
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

function getItemBackgroundColor(list) {
    const baseColor = list.bgColor || '#ffffff';
    return lightenHexColor(baseColor, 0.16);
}

function renderLists() {
    const container = document.getElementById('lists-container');
    const addPlaceholder = document.getElementById('add-list-placeholder');
    container.innerHTML = '';
    container.appendChild(addPlaceholder);

    data.lists.forEach((list) => {
        const listDiv = document.createElement('div');
        listDiv.className = 'list rounded-3xl border border-slate-200 p-6 shadow-sm shadow-slate-300/30';
        listDiv.dataset.id = list.id;
        const listBg = list.bgColor || '#ffffff';
        const titleColor = list.titleColor || '#0f172a';
        const itemBg = getItemBackgroundColor(list);
        listDiv.style.backgroundColor = listBg;
        listDiv.innerHTML = `
            <div class="mb-4 flex items-start justify-between gap-4">
                <h2 class="flex-1 min-w-0 text-xl font-semibold" style="color: ${titleColor};" contenteditable="true" data-id="${list.id}">${list.name}</h2>
                <details class="relative inline-block">
                    <summary class="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100">⋯</summary>
                    <div class="absolute right-0 z-10 mt-2 w-40 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-300/30">
                        <button class="style-list-btn w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-100" data-id="${list.id}">Style list</button>
                        <button class="delete-list-menu-btn w-full rounded-full border border-red-200 bg-red-50 px-3 py-2 text-left text-sm text-red-700 transition hover:border-red-300 hover:bg-red-100" data-id="${list.id}">Delete list</button>
                    </div>
                </details>
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
                    <li class="item flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3 ${item.completed ? 'completed' : ''}" style="background-color: ${itemBg};" draggable="true" data-list-id="${list.id}" data-item-id="${item.id}">
                        <div class="flex flex-1 items-center gap-3 min-w-0">
                            <input type="checkbox" class="item-completed-checkbox h-4 w-4 rounded border-slate-300 text-emerald-600" data-list-id="${list.id}" data-item-id="${item.id}" ${item.completed ? 'checked' : ''}>
                            <span class="item-text flex-1 min-w-0 text-slate-900 ${item.completed ? 'completed' : ''}" contenteditable="true" data-list-id="${list.id}" data-item-id="${item.id}">${item.text}</span>
                        </div>
                        <button class="delete-btn rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:border-red-400 hover:text-red-600" data-list-id="${list.id}" data-item-id="${item.id}" title="Delete item">&#128465;</button>
                    </li>
                `).join('')}
                <li class="add-item-placeholder rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-slate-500 transition hover:border-slate-400 hover:bg-slate-100" contenteditable="true" data-list-id="${list.id}">Click to add new item</li>
            </ul>
            ${renderListDeletedSection(list)}
        `;
        container.appendChild(listDiv);
    });
}

function renderListDeletedSection(list) {
    const deletedItems = data.deletedItems.filter(item => item.listId == list.id);
    if (deletedItems.length === 0) {
        return '';
    }
    const visibleItems = (showAllDeleted[list.id] ? deletedItems : deletedItems.slice(-3)).slice().reverse();
    const showMore = deletedItems.length > 3;
    return `
        <details class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <summary class="cursor-pointer font-semibold text-slate-900">Deleted ${deletedItems.length > 0 ? `(${deletedItems.length})` : ''}</summary>
            <ul class="mt-3 space-y-2">
                ${visibleItems.map(item => `
                    <li class="deleted-item flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500">
                        <span class="truncate">${item.text}</span>
                        <button class="restore-btn text-slate-700 hover:text-slate-900" data-item-id="${item.id}" data-list-id="${list.id}">Restore</button>
                    </li>
                `).join('')}
            </ul>
            ${showMore ? `<button type="button" class="mt-3 text-sm font-medium text-slate-600 hover:text-slate-900 deleted-show-more" data-list-id="${list.id}">${showAllDeleted[list.id] ? 'Show less' : 'Show all'}</button>` : ''}
        </details>
    `;
}

function addList(name) {
    const id = Date.now();
    data.lists.unshift({ id, name, items: [] });
    saveData();
    renderLists();
    focusNewItemPlaceholder(id);
}

function toggleItemCompleted(listId, itemId, completed) {
    const list = data.lists.find(l => l.id == listId);
    if (!list) {
        return;
    }
    const item = list.items.find(i => i.id == itemId);
    if (!item) {
        return;
    }
    item.completed = completed;
    saveData();
    renderLists();
}

function openStyleModal(listId) {
    currentStyleListId = listId;
    const modal = document.getElementById('style-modal');
    if (!modal) {
        return;
    }
    modal.style.display = 'block';
}

function closeStyleModal() {
    const modal = document.getElementById('style-modal');
    if (!modal) {
        return;
    }
    modal.style.display = 'none';
    currentStyleListId = null;
}

function applyListStyle(bgColor, titleColor) {
    if (!currentStyleListId) {
        return;
    }
    const list = data.lists.find(l => l.id == currentStyleListId);
    if (!list) {
        return;
    }
    list.bgColor = bgColor;
    list.titleColor = titleColor;
    saveData();
    renderLists();
    closeStyleModal();
}

function restoreDeletedItem(itemId) {
    const deletedIndex = data.deletedItems.findIndex(item => item.id == itemId);
    if (deletedIndex === -1) {
        return;
    }

    const [deletedItem] = data.deletedItems.splice(deletedIndex, 1);
    const targetList = data.lists.find(l => l.id == deletedItem.listId) || data.lists[0];
    if (targetList) {
        targetList.items.push({ id: deletedItem.id, text: deletedItem.text, completed: deletedItem.completed || false });
    } else {
        data.lists.unshift({ id: Date.now(), name: 'Restored list', items: [{ id: deletedItem.id, text: deletedItem.text, completed: deletedItem.completed || false }] });
    }

    saveData();
    renderLists();
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
    if (!list) {
        return;
    }
    const item = list.items.find(i => i.id == itemId);
    if (!item) {
        return;
    }
    list.items = list.items.filter(i => i.id != itemId);
    data.deletedItems.push({ id: item.id, text: item.text, listId, completed: item.completed || false, deletedAt: Date.now() });
    saveData();
    renderLists();
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
        data = { lists: [], deletedItems: [] };
        hideConsentModal();
        renderLists();
    });

    document.getElementById('storage-settings').addEventListener('click', showSettingsModal);

    document.getElementById('change-consent').addEventListener('click', () => {
        if (consent === 'yes') {
            localStorage.setItem('consent', 'no');
            consent = 'no';
            data = { lists: [], deletedItems: [] };
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
        if (e.target.classList.contains('item-completed-checkbox')) {
            toggleItemCompleted(e.target.dataset.listId, e.target.dataset.itemId, e.target.checked);
            return;
        }
        if (e.target.classList.contains('style-list-btn')) {
            openStyleModal(e.target.dataset.id);
            return;
        }
        if (e.target.classList.contains('delete-list-menu-btn')) {
            const confirmBox = document.getElementById(`delete-confirm-${e.target.dataset.id}`);
            if (confirmBox) {
                confirmBox.classList.toggle('hidden');
            }
            return;
        }
        if (e.target.classList.contains('deleted-show-more')) {
            const listId = e.target.dataset.listId;
            showAllDeleted[listId] = !showAllDeleted[listId];
            renderLists();
            return;
        }
        if (e.target.classList.contains('restore-btn')) {
            restoreDeletedItem(e.target.dataset.itemId);
            return;
        }
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
            if (itemRow && !e.target.classList.contains('delete-btn') && !e.target.classList.contains('item-completed-checkbox')) {
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

    document.getElementById('style-modal').addEventListener('click', (e) => {
        const option = e.target.closest('.style-option');
        if (option) {
            applyListStyle(option.dataset.bgColor, option.dataset.titleColor);
            return;
        }
        if (e.target.id === 'close-style-modal' || e.target.id === 'style-modal') {
            closeStyleModal();
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