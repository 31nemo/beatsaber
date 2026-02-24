let currentPlaylist = null;

// DOM 요소들
const fileInput = document.getElementById('fileInput');
const fileZone = document.getElementById('fileZone');
const editorMain = document.getElementById('editorMain');
const coverPreview = document.getElementById('coverPreview');
const playlistTitle = document.getElementById('playlistTitle');
const playlistAuthor = document.getElementById('playlistAuthor');
const songList = document.getElementById('songList');
const songCount = document.getElementById('songCount');
const imageInput = document.getElementById('imageInput');
const imageOverlayText = document.getElementById('imageOverlayText');
const downloadBtn = document.getElementById('downloadBtn');

// 모달 요소들
const searchModal = document.getElementById('searchModal');
const imageSearchInput = document.getElementById('imageSearchInput');
const searchResults = document.getElementById('searchResults');
const folderInput = document.getElementById('folderInput');

// 수동 추가 모달 요소들
const manualAddModal = document.getElementById('manualAddModal');
const manualName = document.getElementById('manualName');
const manualUploader = document.getElementById('manualUploader');
const manualKey = document.getElementById('manualKey');
const manualHash = document.getElementById('manualHash');
const manualLevelId = document.getElementById('manualLevelId');

let originalImageBase64 = null; // 원본 이미지 보관용
let currentSearchQuery = '';
let searchOffset = 0;
let isSearching = false;
let hasMoreResults = true;

// 파일 열기 관리
fileZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
fileZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileZone.style.borderColor = 'var(--neon-blue)';
});
fileZone.addEventListener('dragleave', () => {
    fileZone.style.borderColor = 'var(--border-color)';
});
fileZone.addEventListener('drop', (e) => {
    e.preventDefault();
    fileInput.files = e.dataTransfer.files;
    handleFileSelect();
});

// 폴더 선택으로 노래 추가
folderInput.addEventListener('change', handleFolderSelect);

// 이미지 입력 변경
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            originalImageBase64 = event.target.result;
            processAndApplyImage();
        };
        reader.readAsDataURL(file);
    }
});

// 오버레이 텍스트 입력 시 실시간 반영
imageOverlayText.addEventListener('input', () => {
    if (originalImageBase64) {
        processAndApplyImage();
    }
});

/**
 * Canvas를 사용하여 원본 이미지 위에 텍스트를 합성하고 결과를 적용합니다.
 */
function processAndApplyImage() {
    if (!originalImageBase64) return;

    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 300x300 요구사항에 맞춰 캔버스 크기 설정
        canvas.width = 300;
        canvas.height = 300;

        // 중앙 크롭 로직 (1:1 비율 유지)
        let sWidth = img.width;
        let sHeight = img.height;
        let sx = 0;
        let sy = 0;

        if (sWidth > sHeight) {
            // 가로가 긴 경우 양옆을 자름
            sx = (sWidth - sHeight) / 2;
            sWidth = sHeight;
        } else if (sHeight > sWidth) {
            // 세로가 긴 경우 위아래를 자름
            sy = (sHeight - sWidth) / 2;
            sHeight = sWidth;
        }

        // 이미지 그리기 (sx, sy에서 sWidth, sHeight 만큼 가져와서 300x300에 그림)
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 300, 300);

        const text = imageOverlayText.value;
        if (text) {
            // 텍스트 스타일링
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 240, 300, 50); // 텍스트 배경 바 (크기 비례 조정)

            ctx.fillStyle = 'white';
            ctx.font = 'bold 27px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 텍스트 외곽선
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.strokeText(text, 150, 265);
            ctx.fillText(text, 150, 265);
        }

        const finalBase64 = canvas.toDataURL('image/png');
        currentPlaylist.imageString = finalBase64.split(',')[1];
        coverPreview.src = finalBase64;
    };
    img.src = originalImageBase64;
}

// 이미지 검색 관련 함수들
function openSearchModal() {
    searchModal.style.display = 'block';
    if (playlistTitle.value && !imageSearchInput.value) {
        imageSearchInput.value = playlistTitle.value;
    }
}

function closeSearchModal() {
    searchModal.style.display = 'none';
}

async function searchImages(isLoadMore = false) {
    if (isSearching) return;

    const query = imageSearchInput.value.trim();
    if (!query) return;

    if (!isLoadMore) {
        searchResults.innerHTML = '<div class="loading-text">이미지를 찾는 중...</div>';
        searchOffset = 0;
        hasMoreResults = true;
        currentSearchQuery = query;
    }

    if (!hasMoreResults) return;

    isSearching = true;

    try {
        // iTunes Search API 활용 (음악/앨범 중심 검색, API 키 불필요, 고화질)
        // limit=50으로 한 번에 많은 결과를 가져오며, offset으로 페이지네이션 가능
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(currentSearchQuery)}&entity=album&limit=50&offset=${searchOffset}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!isLoadMore) searchResults.innerHTML = '';

        const existingLoading = searchResults.querySelector('.loading-text');
        if (existingLoading) existingLoading.remove();

        if (data.results && data.results.length > 0) {
            data.results.forEach(result => {
                // 기본 100x100 이미지를 600x600 고화질로 변환
                const lowResUrl = result.artworkUrl100;
                const highResUrl = lowResUrl.replace('100x100bb', '600x600bb');

                const img = document.createElement('img');
                img.src = lowResUrl;
                img.className = 'result-item';
                img.title = `${result.collectionName} - ${result.artistName}`;
                img.onclick = () => selectRemoteImage(highResUrl);
                searchResults.appendChild(img);
            });

            // 페이지네이션 처리
            searchOffset += data.resultCount;
            if (data.resultCount < 50) {
                hasMoreResults = false;
            }
        } else {
            if (!isLoadMore) searchResults.innerHTML = '<div class="loading-text">검색 결과가 없습니다.</div>';
            hasMoreResults = false;
        }
    } catch (error) {
        console.error('Search error:', error);
        if (!isLoadMore) searchResults.innerHTML = '<div class="loading-text">검색 중 오류가 발생했습니다.</div>';
    } finally {
        isSearching = false;
    }
}

// 스크롤 이벤트 감지 - 무한 스크롤
searchResults.addEventListener('scroll', () => {
    if (searchResults.scrollTop + searchResults.clientHeight >= searchResults.scrollHeight - 50) {
        if (hasMoreResults && !isSearching) {
            searchImages(true);
        }
    }
});

function selectRemoteImage(url) {
    // CORS 문제를 피하기 위해 이미지를 로드하여 base64로 변환
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        originalImageBase64 = canvas.toDataURL('image/png');
        processAndApplyImage(); // 리사이징 및 텍스트 합성 적용
        closeSearchModal();
    };
    img.src = url;
}

// 모달 외부 클릭 시 닫기
window.onclick = (event) => {
    if (event.target == searchModal) {
        closeSearchModal();
    } else if (event.target == manualAddModal) {
        closeManualModal();
    }
};

// 엔터 키 검색 지원
imageSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchImages();
});

function handleFileSelect() {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            currentPlaylist = JSON.parse(e.target.result);
            renderPlaylist();
        } catch (error) {
            alert('유효하지 않은 .bplist 파일입니다.');
            console.error(error);
        }
    };
    // 한글 깨짐 방지를 위해 UTF-8 인코딩 명시
    reader.readAsText(file, 'UTF-8');
}

function renderPlaylist() {
    fileZone.style.display = 'none';
    editorMain.style.display = 'block';

    playlistTitle.value = currentPlaylist.playlistTitle || '';
    playlistAuthor.value = currentPlaylist.playlistAuthor || '';

    // 이미지 처리 (최초 로드 시 원본으로 저장)
    if (currentPlaylist.imageString) {
        originalImageBase64 = `data:image/png;base64,${currentPlaylist.imageString}`;
        coverPreview.src = originalImageBase64;
    }

    renderSongs();
}

function renderSongs() {
    songList.innerHTML = '';
    const songs = currentPlaylist.songs || [];
    songCount.innerText = songs.length;

    songs.forEach((song, index) => {
        const item = document.createElement('div');
        item.className = 'song-item';
        // 'name' 필드와 'songName' 필드 모두 호환되도록 처리
        const displayName = song.name || song.songName || 'Unknown Song';
        // 드래그 앤 드롭 지원
        item.draggable = true;
        item.dataset.index = index;

        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);

        item.innerHTML = `
            <div class="drag-handle" title="드래그하여 순서 변경">⋮⋮</div>
            <div class="song-info">
                <input type="text" class="song-name-input" value="${escapeHtml(displayName)}" 
                    onchange="updateSongName(${index}, this.value)" title="제목 수정">
                <div class="song-meta">Hash: ${song.hash?.substring(0, 8)}... | Key: ${song.key || 'N/A'}</div>
            </div>
            <button class="btn btn-danger" onclick="deleteSong(${index})">삭제</button>
        `;
        songList.appendChild(item);
    });
}

function updateSongName(index, newName) {
    const song = currentPlaylist.songs[index];
    song.name = newName;
    song.songName = newName; // 호환성을 위해 둘 다 업데이트
}

function deleteSong(index) {
    if (confirm('이 노래를 삭제하시겠습니까?')) {
        currentPlaylist.songs.splice(index, 1);
        renderSongs();
    }
}

function moveSong(index, direction) {
    // 버튼 방식 대신 드래그 앤 드롭을 위해 남겨둠 (내부 로직용으로 전환 가능)
    const songs = currentPlaylist.songs;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= songs.length) return;
    const temp = songs[index];
    songs[index] = songs[newIndex];
    songs[newIndex] = temp;
    renderSongs();
}

let draggedIndex = null;

function handleDragStart(e) {
    draggedIndex = parseInt(this.dataset.index);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    const targetIndex = parseInt(this.dataset.index);
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const songs = currentPlaylist.songs;
    const draggedItem = songs.splice(draggedIndex, 1)[0];
    songs.splice(targetIndex, 0, draggedItem);

    renderSongs();
}

function handleDragEnd() {
    this.classList.remove('dragging');
    draggedIndex = null;
}

function sortSongsAlphabetically() {
    const songs = currentPlaylist.songs;
    songs.sort((a, b) => {
        const nameA = (a.name || a.songName || '').toLowerCase();
        const nameB = (b.name || b.songName || '').toLowerCase();
        return nameA.localeCompare(nameB, 'ko', { sensitivity: 'base' });
    });
    renderSongs();
    alert('곡 목록이 가나다/ABC 순으로 정렬되었습니다.');
}
function openManualModal() {
    manualAddModal.style.display = 'block';
    // 입력창 초기화
    manualName.value = '';
    manualUploader.value = '';
    manualKey.value = '';
    manualHash.value = '';
    manualLevelId.value = '';
}

function closeManualModal() {
    manualAddModal.style.display = 'none';
}

function saveManualSong() {
    const name = manualName.value.trim();
    if (!name) {
        alert('곡 제목은 필수입니다.');
        return;
    }

    const hash = manualHash.value.trim().toUpperCase();
    let levelid = manualLevelId.value.trim();

    // Hash가 있는데 LevelID가 없으면 자동으로 생성
    if (hash && !levelid) {
        levelid = `custom_level_${hash}`;
    }

    currentPlaylist.songs.push({
        name: name,
        songName: name,
        uploader: manualUploader.value.trim(),
        key: manualKey.value.trim(),
        hash: hash,
        levelid: levelid
    });

    renderSongs();
    closeManualModal();
}

// 기존 addPlaceholderSong 대체 (HTML에서 호출됨)
function addPlaceholderSong() {
    openManualModal();
}

// 추출 및 다운로드
downloadBtn.addEventListener('click', () => {
    if (!currentPlaylist) return;

    updateCurrentPlaylistData();

    const dataStr = JSON.stringify(currentPlaylist, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPlaylist.playlistTitle || 'playlist'}.bplist`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
});

function updateCurrentPlaylistData() {
    if (!currentPlaylist) return;
    currentPlaylist.playlistTitle = playlistTitle.value;
    currentPlaylist.playlistAuthor = playlistAuthor.value;
}

function viewRawJson() {
    if (!currentPlaylist) return;

    updateCurrentPlaylistData();
    const dataStr = JSON.stringify(currentPlaylist, null, 2);

    const newWindow = window.open();
    newWindow.document.write('<pre style="background: #1e1e1e; color: #d4d4d4; padding: 20px; font-family: monospace; white-space: pre-wrap; word-wrap: break-word;">' +
        escapeHtml(dataStr) +
        '</pre>');
    newWindow.document.title = "Raw JSON View";
}

async function handleFolderSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // 1. info.dat 찾기
    const infoFile = files.find(f => f.name.toLowerCase() === 'info.dat');
    if (!infoFile) {
        alert('선택한 폴더에 info.dat 파일이 없습니다.');
        return;
    }

    try {
        const infoText = await infoFile.text();
        const info = JSON.parse(infoText);

        // 2. 폴더명에서 Key와 SongName 추출 (xxx (yyy) 형태)
        // webkitRelativePath 예시: "25f (Ditto)/info.dat"
        const folderPath = infoFile.webkitRelativePath;
        const folderName = folderPath.split('/')[0];
        const match = folderName.match(/^(.+?)\s*\((.+)\)$/);

        let key = "";
        let songName = info._songName || "Unknown";

        if (match) {
            key = match[1].trim();
            songName = match[2].trim();
        }

        // 3. 해시 계산을 위한 파일들 수집 (info.dat + 각 난이도 .dat)
        const difficultyFiles = [];
        if (info._difficultyBeatmapSets) {
            info._difficultyBeatmapSets.forEach(set => {
                if (set._difficultyBeatmaps) {
                    set._difficultyBeatmaps.forEach(map => {
                        if (map._beatmapFilename) {
                            difficultyFiles.push(map._beatmapFilename);
                        }
                    });
                }
            });
        }

        // 중복 제거 및 실제 파일 매칭
        const uniqueDiffNames = [...new Set(difficultyFiles)];
        const dataChunks = [];

        // info.dat 본문 (바이트 그대로)
        dataChunks.push(await infoFile.arrayBuffer());

        // 순서대로 난이도 파일들 추가
        for (const fileName of uniqueDiffNames) {
            const file = files.find(f => f.name.toLowerCase() === fileName.toLowerCase());
            if (file) {
                dataChunks.push(await file.arrayBuffer());
            }
        }

        // 4. SHA-1 해시 계산
        const combinedBuffer = await combineBuffers(dataChunks);
        const hashBuffer = await crypto.subtle.digest('SHA-1', combinedBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

        // 5. 노래 추가
        currentPlaylist.songs.push({
            hash: hashHex,
            levelid: `custom_level_${hashHex}`,
            name: songName,
            songName: songName, // 둘 다 지원
            key: key
        });

        renderSongs();
        alert(`'${songName}' 곡이 확인되었습니다.`);

    } catch (error) {
        console.error('Folder processing error:', error);
        alert('폴더 처리 중 오류가 발생했습니다.');
    }
}

async function combineBuffers(buffers) {
    const totalLength = buffers.reduce((acc, buf) => acc + buf.byteLength, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of buffers) {
        combined.set(new Uint8Array(buf), offset);
        offset += buf.byteLength;
    }
    return combined.buffer;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
