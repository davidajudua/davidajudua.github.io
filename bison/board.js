(function () {
  var BUCKETS = [
    { key: 'ready', label: 'Ready for review' },
    { key: 'submitted', label: 'Submitted', archiveKey: 'submitted_archive' },
    { key: 'upcoming', label: 'Upcoming' },
  ];

  var root = document.getElementById('bison-board');
  var updatedEl = document.getElementById('bison-updated');
  if (!root) return;

  function text(el, value) {
    el.textContent = value == null ? '' : String(value);
  }

  function renderItem(item) {
    var article = document.createElement('article');
    article.className = 'bison-item';

    var title = document.createElement('h3');
    title.className = 'bison-item__title';
    text(title, item.title);
    article.appendChild(title);

    var meta = document.createElement('p');
    meta.className = 'bison-item__meta';
    text(meta, [item.course, item.due].filter(Boolean).join(' · '));
    article.appendChild(meta);

    if (item.note) {
      var note = document.createElement('p');
      note.className = 'bison-item__note';
      text(note, item.note);
      article.appendChild(note);
    }

    return article;
  }

  function fillList(list, rows) {
    list.replaceChildren();
    if (rows.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'bison-empty';
      text(empty, 'Nothing here');
      list.appendChild(empty);
      return;
    }
    rows.forEach(function (item) {
      list.appendChild(renderItem(item || {}));
    });
  }

  function renderBucket(bucket, feed) {
    var section = document.createElement('section');
    section.className = 'bison-bucket';
    section.setAttribute('aria-labelledby', 'bucket-' + bucket.key);

    var heading = document.createElement('h2');
    heading.className = 'bison-bucket__label';
    heading.id = 'bucket-' + bucket.key;
    text(heading, bucket.label);
    section.appendChild(heading);

    var list = document.createElement('div');
    list.className = 'bison-bucket__list';

    var recent = Array.isArray(feed[bucket.key]) ? feed[bucket.key] : [];
    var archive = bucket.archiveKey && Array.isArray(feed[bucket.archiveKey])
      ? feed[bucket.archiveKey]
      : [];
    var expanded = false;

    fillList(list, recent);
    section.appendChild(list);

    if (archive.length > 0) {
      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'bison-more';
      text(toggle, 'Show more');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.addEventListener('click', function () {
        expanded = !expanded;
        fillList(list, expanded ? recent.concat(archive) : recent);
        text(toggle, expanded ? 'Show less' : 'Show more');
        toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      });
      section.appendChild(toggle);
    }

    return section;
  }

  function render(feed) {
    root.replaceChildren();
    BUCKETS.forEach(function (bucket) {
      root.appendChild(renderBucket(bucket, feed));
    });
    if (updatedEl && feed.updated) {
      text(updatedEl, 'Updated ' + feed.updated);
    }
  }

  function failQuietly() {
    root.replaceChildren();
    var err = document.createElement('p');
    err.className = 'bison-empty';
    text(err, 'Board unavailable');
    root.appendChild(err);
  }

  fetch('./feed.json', { cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) throw new Error('feed');
      return res.json();
    })
    .then(render)
    .catch(failQuietly);
})();
