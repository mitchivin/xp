let lastStatusUpdate = 0;

// Media Player Custom Element Implementation
// Implements a Windows Media Player XP-like UI as a custom <wm-player> element.
// Includes playlist, slider, and player logic. See index.html for usage.

// --- Begin mediaPlayer.playlist.js ---
class WMPlaylistItem {
   #src = null;
   constructor(o) {
      if (typeof o === 'string') {
         this.#src = o;
      } else {
         this.#src = o?.src || null;
      }
   }
   get empty() {
      return !this.#src;
   }
   populateMediaElement(media) {
      media.src = this.#src || "";
      media.currentTime = 0;
   }
}

class WMPlaylist extends EventTarget {
   #items = [];
   #index = 0;
   constructor() {
      super();
   }
   empty() { return this.#items.length == 0; }
   get currentItem() { return this.#items[this.#index] || null; }
   get index() { return this.#index; }
   set index(v) {
      v = +v;
      if (v < 0 || v >= this.#items.length) return;
      this.#index = v;
      this.dispatchEvent(new CustomEvent("current-item-changed", { detail: { index: v, item: this.currentItem } }));
   }
   get length() { return this.#items.length; }
   get size() { return this.#items.length; }
   add(item) {
      if (!(item instanceof WMPlaylistItem)) {
         item = new WMPlaylistItem(item);
         if (item.empty) return;
      }
      this.#items.push(item);
      this.dispatchEvent(new Event("modified"));
      if (this.#items.length == 1) {
         this.index = 0;
      }
   }
   clear() {
      this.#items = [];
      this.#index = 0;
      this.dispatchEvent(new Event("cleared"));
      this.dispatchEvent(new CustomEvent("current-item-changed", { detail: { index: null, item: null } }));
   }
   indexOf(item) { return this.#items.indexOf(item); }
   remove(a, count) {
      if (count === void 0) count = 1;
      else if (count == 0) return;
      else if (count < 0) throw new Error("cannot remove a negative amount of items");
      let i;
      if (a instanceof WMPlaylistItem) {
         i = this.indexOf(a);
         if (i < 0) return;
      } else {
         i = +a;
         if (isNaN(i)) throw new TypeError("must specify a WMPlaylistItem or an index");
         if (i < 0) {
            count += i;
            i = 0;
            if (count < 0) return;
         }
      }
      this.#items.splice(i, count);
      let changed = false;
      if (this.#index >= i && this.#index < i + count) {
         this.#index = i;
         changed = true;
      }
      this.dispatchEvent(new Event("modified"));
      if (changed) this.dispatchEvent(new CustomEvent("current-item-changed", { detail: { index: this.#index, item: this.currentItem } }));
   }
   toNext() {
      if (this.#items.length === 0) return false;
      if (this.#index < this.#items.length - 1) {
         this.index = this.#index + 1;
         return true;
      } else if (this.#items.length > 1) {
         this.index = 0;
         return true;
      }
      return false;
   }
   toPrev() {
      if (this.#index > 0) {
         this.index = this.#index - 1;
         return true;
      } else if (this.#items.length > 1) {
         this.index = this.#items.length - 1;
         return true;
      }
      return false;
   }
   hasNextItem() {
      return this.#index < this.#items.length - 1;
   }
   markAsPlayed() {
      // No-op: placeholder for compatibility with other playlist APIs
   }
}
// --- End mediaPlayer.playlist.js ---

// --- Begin mediaPlayer.slider.js ---
// Custom slider element for seek and volume controls
class WMPlayerSliderElement extends HTMLElement {
   static formAssociated = true;
   #internals;
   #shadow;
   #track_full;
   #track_bare;
   #thumb;
   #bound_drag_move_handler;
   #bound_drag_stop_handler;
   #disabled = false;
   #minimum  = 0;
   #maximum  = 100;
   #step     = 0;
   #value    = 0;
   #key_step       = 0;
   #key_step_ctrl  = 0;
   #key_step_shift = 0;
   #has_ever_been_connected = false;
   #is_dragging = false;
   static #base_path = "";
   static get basePath() {
      return this.#base_path;
   }
   static {
      if (document.currentScript) {
         let src = (function() {
            try {
               return new URL(".", document.currentScript.src);
            } catch (e) {
               return null;
            }
         })();
         if (src) {
            this.#base_path = src + "/";
         }
      }
   }
   constructor() {
      super();
      this.#internals = this.attachInternals();
      this.#shadow    = this.attachShadow({ mode: "open" });
      // Attach slider stylesheet
      let link = document.createElement("link");
      link.setAttribute("rel", "stylesheet");
      link.setAttribute("href", WMPlayerSliderElement.basePath + "style.css");
      this.#shadow.append(link);
      // Create slider track and thumb
      this.#track_bare = document.createElement("div");
      this.#track_full = document.createElement("div");
      this.#thumb = document.createElement("div");
      this.#track_bare.classList.add("track-bare");
      this.#track_full.classList.add("track-full");
      this.#thumb.classList.add("thumb");
      this.#shadow.append(
         this.#track_bare,
         this.#track_full,
         this.#thumb
      );
      // Bind drag events
      let bound = this.#on_drag_start.bind(this);
      this.addEventListener("mousedown", bound);
      this.addEventListener("pointerdown", bound);
      this.addEventListener("touchstart", bound);
      this.#bound_drag_move_handler = this.#on_drag_tick.bind(this);
      this.#bound_drag_stop_handler = this.#on_drag_end.bind(this);
      this.addEventListener("keydown", this.#on_key_down.bind(this));
      // Set ARIA attributes for accessibility
      this.#internals.ariaRole = "slider";
      this.#internals.ariaValueNow = this.#value;
      this.#internals.ariaValueMin = this.#minimum;
      this.#internals.ariaValueMax = this.#maximum;
   }
   #setting_attribute = false;
   static observedAttributes = ["disabled", "max", "min", "step"];
   attributeChangedCallback(name, prior, after) {
      if (this.#setting_attribute)
         return;
      switch (name) {
         case "disabled":
            this.disabled = (after !== null);
            return;
         case "max":
            this.maximum = after;
            return;
         case "min":
            this.minimum = after;
            return;
         case "step":
            this.step = after;
            return;
      }
   }
   connectedCallback() {
      if (this.#has_ever_been_connected)
         return;
      this.#has_ever_been_connected = true;
      
      this.disabled = this.#disabled;
      
      let attr;
      
      attr = this.getAttribute("max");
      if (!isNaN(+attr))
         this.maximum = +attr;
      
      attr = this.getAttribute("min");
      if (!isNaN(+attr))
         this.minimum = +attr;
      
      attr = this.getAttribute("step");
      if (!isNaN(+attr))
         this.step = +attr;
      
      attr = this.getAttribute("value");
      if (!isNaN(+attr))
         this.value = +attr;
   }
   
   get disabled() { return this.#disabled; }
   set disabled(v) {
      v = !!v;
      this.#disabled = v;
      if (this.#has_ever_been_connected) {
         //
         // - Update ability to receive focus (tabindex)
         // - Update element states
         // - Reflect to `disabled` attribute
         //
         if (v) {
            this.removeAttribute("tabindex");
            if (this.#internals.states) {
               this.#internals.states.delete("active");
               this.#internals.states.add("disabled");
            }
            this.#setting_attribute = true;
            this.setAttribute("disabled", "disabled");
            this.#setting_attribute = false;
         } else {
            this.setAttribute("tabindex", "0");
            if (this.#internals.states) {
               this.#internals.states.delete("disabled");
            }
            this.#setting_attribute = true;
            this.removeAttribute("disabled");
            this.#setting_attribute = false;
         }
      }
      if (v)
         this.#on_drag_end(null);
   }
   
   get value() { return this.#value; }
   set value(v) {
      v = Math.min(this.#maximum, Math.max(this.#minimum, +v));
      this.#value = v;
      this.#internals.ariaValueNow = v;
      this.#internals.setFormValue(v);
      this.style.setProperty("--value", v);
   }
   
   get valueAsNumber() { return this.#value; }
   set valueAsNumber(v) { this.value = v; }
   
   get keyStep() { return this.#key_step; }
   set keyStep(v) { this.#key_step = +v; }
   get keyStepCtrl() { return this.#key_step_ctrl; }
   set keyStepCtrl(v) { this.#key_step_ctrl = +v; }
   get keyStepShift() { return this.#key_step_shift; }
   set keyStepShift(v) { this.#key_step_shift = +v; }
   
   
   get step() { return this.#step; }
   set step(v) {
      this.#step = Math.max(0, +v);
      
      this.#setting_attribute = true;
      this.setAttribute("step", v);
      this.#setting_attribute = false;
   }
   
   get minimum() { return this.#minimum; }
   set minimum(v) {
      v = +v;
      this.#minimum = v;
      this.style.setProperty("--minimum", v);
      if (this.#value < v)
         this.#value = v;
      
      this.#internals.ariaValueMin = v;
      this.#setting_attribute = true;
      this.setAttribute("min", v);
      this.#setting_attribute = false;
   }
   
   get maximum() { return this.#maximum; }
   set maximum(v) {
      v = +v;
      this.#maximum = v;
      this.style.setProperty("--maximum", v);
      if (this.#value > v)
         this.#value = v;
      
      this.#internals.ariaValueMax = v;
      this.#setting_attribute = true;
      this.setAttribute("max", v);
      this.#setting_attribute = false;
   }
   
   //
   // Form attribute reflection:
   //
   
   get defaultValue() {
      return +this.getAttribute("value");
   }
   set defaultValue(v) {
      this.setAttribute("value", +v);
   }
   
   get labels() { return this.#internals.labels; }
   
   get name() {
      return this.getAttribute("name");
   }
   set name(v) {
      if (v === null)
         this.removeAttribute("name");
      else
         this.setAttribute("name", v+"");
   }
   
   //
   
   is_being_edited() { return this.#is_dragging; }
   
   #pointer_pos_to_slider_pos(e) {
      let bounds = this.getBoundingClientRect();
      let thumb  = this.#thumb.getBoundingClientRect();
      let thumb_half_size = thumb.width / 2;
      let start   = bounds.left  + thumb_half_size;
      let end     = bounds.right - thumb_half_size;
      let pointer = e.clientX;
      return (pointer - start) / (end - start);
   }
   
   #on_drag_start(e) {
      if (e.button)
         return;
      
      this.#is_dragging = true;
      if (this.#internals.states)
         this.#internals.states.add("active");
      
      e.preventDefault();
      {
         window.addEventListener("mousemove",   this.#bound_drag_move_handler);
         window.addEventListener("pointermove", this.#bound_drag_move_handler);
         window.addEventListener("touchmove",   this.#bound_drag_move_handler);
         window.addEventListener("mouseup",     this.#bound_drag_stop_handler);
         window.addEventListener("pointerup",   this.#bound_drag_stop_handler);
         window.addEventListener("touchend",    this.#bound_drag_stop_handler);
      }
      if (e.target != this.#thumb) {
         let pos = this.#pointer_pos_to_slider_pos(e);
         this.#set_relative_position(pos);
         this.dispatchEvent(new Event("change"));
      }
      this.dispatchEvent(new Event("edit-start"));
   }
   #on_drag_tick(e) {
      e.preventDefault();
      let pos = this.#pointer_pos_to_slider_pos(e);
      this.#set_relative_position(pos);
      this.dispatchEvent(new Event("change"));
   }
   #on_drag_end() {
      if (!this.#is_dragging)
         return;
      this.#is_dragging = false;
      {
         window.removeEventListener("mousemove",   this.#bound_drag_move_handler);
         window.removeEventListener("pointermove", this.#bound_drag_move_handler);
         window.removeEventListener("touchmove",   this.#bound_drag_move_handler);
         window.removeEventListener("mouseup",     this.#bound_drag_stop_handler);
         window.removeEventListener("pointerup",   this.#bound_drag_stop_handler);
         window.removeEventListener("touchend",    this.#bound_drag_stop_handler);
      }
      if (this.#internals.states)
         this.#internals.states.delete("active");
      
      if (this.#step) {
         this.style.setProperty("--value", this.#value);
      }
      this.dispatchEvent(new Event("edit-stop"));
   }
   
   #on_key_down(e) {
      if (this.disabled)
         return;
      if (e.altKey || (e.shiftKey && e.ctrlKey))
         return;
      let magnitude = 0;
      switch (e.code) {
         case "ArrowLeft":
            magnitude = -1;
            break;
         case "ArrowRight":
            magnitude = 1;
            break;
         default:
            return;
      }
      e.preventDefault();
      {
         let step = this.#key_step;
         if (e.ctrlKey)
            step = this.#key_step_ctrl;
         else if (e.shiftKey)
            step = this.#key_step_shift;
         step = Math.max(step, this.#step);
         if (step)
            magnitude *= step;
      }
      this.value = this.#value + magnitude;
   }
   
   #clamp(value) {
      return Math.max(this.#minimum, Math.min(this.#maximum, value));
   }
   
   #set_relative_position(pos) { // v is in the range [0, 1]
      if (pos < 0)
         pos = 0;
      else if (pos > 1)
         pos = 1;
      
      let value = pos * (this.#maximum - this.#minimum) + this.#minimum;
      if (this.#is_dragging) {
         if (this.#step)
            this.#value = this.#clamp(Math.round(value / this.#step) * this.#step);
         else
            this.#value = value;
      } else {
         if (this.#step)
            value = this.#clamp(Math.round(value / this.#step) * this.#step);
         this.#value = value;
      }
      this.style.setProperty("--value", value);
   }
};
customElements.define(
   "wm-slider",
   WMPlayerSliderElement
);
// --- End mediaPlayer.slider.js ---

// --- Begin mediaPlayer.js ---
// Main custom element for the media player UI and logic
class WMPlayerElement extends HTMLElement {
   
   //
   // Options:
   //
   
   #control_names_to_nodes;
   #controls_layout = (function() {
      let out = {
         tray_left:    [],
         tray_right:   [],
         gutter_right: [],
      };
      let str = {};
      for(let key in out) {
         str[key] = null;
      }
      out.computed  = str;
      out.requested = Object.seal(Object.assign({}, str));
      Object.seal(str);
      Object.seal(out);
      return out;
   })();
   
   #playlist = new WMPlaylist();
   #autoplay = false;
   #speed    = 1; // playbackRate
   //
   #fast_forward_delay = 1; // hold Next down for this many seconds to start fast-forwarding
   #fast_forward_speed = 5; // same speed as WMP
   #fast_rewind_speed  = 5;
   
   // If the current time is past this number of seconds, then clicking "Previous" 
   // jumps to the start of the current media item, rather than to the previous 
   // media item in the playlist.
   #previous_button_time_threshold = 3;
   
   //
   // State:
   //
   
   #current_playlist_index         = 0;
   #current_playlist_index_started = false;
   #playlist_shuffle_indices       = [];
   
   #fast_playback_type    = 0; // -1 = rewind, 1 = fast-forward, 0 = neither
   #fast_playback_timeout = null;
   #fast_playback_paused  = false; // if we were paused when fast playback began
   
   #fast_rewind_interval  = 1; // number of real-time seconds between rewind steps
   #fast_rewind_timeout   = null;
   
   #bound_fast_playback_stop_on_release_handler;
   
   #is_stopped = true;
   
   //
   // DOM and similar:
   //
   
   #shadow;
   #internals;
   
   #media;
   
   #current_time_readout;
   #loop_button;
   #mute_button;
   #next_button;
   #play_pause_button;
   #prev_button;
   #seek_slider;
   #shuffle_button;
   #stop_button;
   #volume_slider;
   
   #setting_attribute = false;
   
   static HTML = `
<link rel="stylesheet" href="style.css" />
<div class="main">
   <div class="content">
      <video></video>
      <div class="overlay-controls">
         <wm-slider class="seek" title="Seek" aria-label="Seek"></wm-slider>
         <div class="controls">
            <div class="left">
               <time class="current-time" aria-label="Current time"></time>
               <input type="checkbox" aria-label="Shuffle" aria-role="switch" class="basic-button shuffle" />
               <input type="checkbox" aria-label="Loop" aria-role="switch" class="basic-button loop" />
               <hr />
               <button class="basic-button stop" disabled title="Stop">Stop</button>
               <button class="prev-rw" disabled title="Previous (press and hold to rewind)">Previous</button>
            </div>
            <button class="play-pause">Play</button>
            <div class="right">
               <button class="next-ff" disabled title="Next (press and hold to fast-forward)">Next</button>
               <input type="checkbox" aria-label="Mute" aria-role="switch" class="basic-button mute" />
               <wm-slider aria-label="Volume" class="volume constant-thumb circular-thumb" min="0" max="100" value="100" step="1" title="Volume"></wm-slider>
            </div>
         </div>
      </div>
   </div>
</div>
`.trim();
   static {
      if (document.currentScript) {
         let src = (function() {
            try {
               return new URL(".", document.currentScript.src);
            } catch (e) {
               return null;
            }
         })();
         if (src) {
            this.HTML = this.HTML.replaceAll(`<link rel="stylesheet" href="`, `<link rel="stylesheet" href="${src}`);
         }
      }
   }
   
   // ------------------------------------------------------------------------
   
   // Expose properties and methods of the wrapped media element.
   static {
      for(const name of [
         // HTMLMediaElement:
         "buffered",
         "currentSrc",
         "duration",
         "ended",
         "error",
         "mediaKeys",
         "networkState",
         "paused",
         "played",
         "readyState",
         "remote",
         "seekable",
         "seeking",
         "sinkId",
         "textTracks",
         "videoTracks",
         // HTMLVideoElement:
         "videoHeight",
         "videoWidth",
      ]) {
         Object.defineProperty(this.prototype, name, {
            get: function() { return this.#media[name]; }
         });
      }
      
      for(const name of [
         // HTMLMediaElement:
         "audioTracks",
         "crossOrigin",
         "currentTime",
         "disableRemotePlayback",
         "preservesPitch",
         "srcObject",
         "volume",
         // HTMLVideoElement:
         "disablePictureInPicture",
      ]) {
         Object.defineProperty(this.prototype, name, {
            get: function() { return this.#media[name]; },
            set: function(v) { this.#media[name] = v; }
         });
      }
      
      for(const name of [
         // HTMLMediaElement:
         "addTextTrack",
         "captureStream",
         "canPlayType",
         "fastSeek",
         "load",
         "pause",
         "play",
         "setMediaKeys",
         "setSinkId",
         // HTMLVideoElement:
         "cancelVideoFrameCallback",
         "getVideoPlaybackQuality",
         "requestPictureInPicture",
         "requestVideoFrameCallback",
      ]) {
         this.prototype[name] = function(...args) {
            return this.#media[name](...args);
         };
      }
   };
   
   // ------------------------------------------------------------------------
   
   constructor() {
      super();
      this.#internals = this.attachInternals();
      this.#shadow    = this.attachShadow({ mode: "closed" });
      
      this.#shadow.innerHTML = this.constructor.HTML;
      
      this.#playlist.addEventListener("cleared", this.#on_playlist_cleared.bind(this));
      this.#playlist.addEventListener("replaced", this.#on_playlist_replaced.bind(this));
      this.#playlist.addEventListener("modified", this.#on_playlist_modified.bind(this));
      this.#playlist.addEventListener("current-item-changed", this.#on_playlist_current_item_changed.bind(this));
      
      this.#media = this.#shadow.querySelector("video");
      // Hide video until ready
      const main = this.#shadow.querySelector('.main');
      if (main) main.classList.add('video-hidden');
      this.#media.addEventListener("loadedmetadata", this.#on_loaded_metadata.bind(this));
      this.#media.addEventListener("timeupdate", this.#on_current_time_change.bind(this));
      this.#media.addEventListener("durationchange", this.#on_duration_change.bind(this));
      this.#media.addEventListener("volumechange", this.#on_volume_change.bind(this));
      this.#media.addEventListener("play", this.#on_media_play.bind(this));
      this.#media.addEventListener("pause", this.#update_play_state.bind(this));
      this.#media.addEventListener("ended", this.#on_media_ended.bind(this));
      {
         let bound = this.#update_buffering_state.bind(this);
         this.#media.addEventListener("buffering", bound);
         this.#media.addEventListener("stalled", bound);
         this.#media.addEventListener("canplay", bound);
         this.#media.addEventListener("canplaythrough", bound);
      }
      
      this.#current_time_readout = this.#shadow.querySelector("time");
      
      this.#seek_slider = this.#shadow.querySelector(".seek");
      this.#seek_slider.keyStepShift = 1;
      this.#seek_slider.keyStep      = 10;
      this.#seek_slider.keyStepCtrl  = 10;
      this.#seek_slider.addEventListener("change", this.#on_seek_slider_change.bind(this));
      
      this.#shuffle_button = this.#shadow.querySelector(".shuffle");
      this.#shuffle_button.disabled = true;
      this.#loop_button = this.#shadow.querySelector(".loop");
      this.#loop_button.disabled = true;
      
      this.#play_pause_button = this.#shadow.querySelector("button.play-pause");
      this.#play_pause_button.addEventListener("click", this.#on_play_pause_click.bind(this));
      
      this.#stop_button = this.#shadow.querySelector("button.stop");
      this.#stop_button.addEventListener("click", this.#on_stop_click.bind(this));
      
      this.#mute_button = this.#shadow.querySelector(".mute");
      this.#mute_button.addEventListener("click", this.#on_mute_ui_toggled.bind(this));
      
      this.#volume_slider = this.#shadow.querySelector(".volume");
      this.#volume_slider.keyStep      = 5;
      this.#volume_slider.keyStepShift = 1;
      this.#volume_slider.keyStepCtrl  = 20; // 1/5 the slider length
      this.#volume_slider.addEventListener("change", this.#on_volume_slider_change.bind(this));
      
      this.#next_button = this.#shadow.querySelector(".next-ff");
      this.#next_button.disabled = true; // Always disabled since only one video
      this.#next_button.addEventListener("mousedown", this.#on_next_mousedown.bind(this));
      this.#next_button.addEventListener("mouseup", this.#on_next_mouseup.bind(this));
      this.#next_button.addEventListener("keypress", this.#on_next_keypress.bind(this));
      
      this.#prev_button = this.#shadow.querySelector(".prev-rw");
      this.#prev_button.addEventListener("mousedown", this.#on_prev_mousedown.bind(this));
      this.#prev_button.addEventListener("mouseup", this.#on_prev_mouseup.bind(this));
      this.#prev_button.addEventListener("keypress", this.#on_prev_keypress.bind(this));
      
      // If we only listen for `mouseup` on the Previous and Next buttons, then in the 
      // case where the user presses and holds the mouse on the buttons, but then moves 
      // the cursor off the buttons before releasing it, we'll get stuck fast-forwarding 
      // or rewinding. We work around this by registering and unregistering a handler on 
      // the window.
      this.#bound_fast_playback_stop_on_release_handler = this.#fast_playback_stop_on_release_handler.bind(this);
      
      {
         let bound = this.#disqualify_autoplay_on_playback_control_by_user.bind(this);
         for(let node of [
            this.#next_button,
            this.#play_pause_button,
            this.#prev_button,
            this.#stop_button,
         ]) {
            //
            // If these buttons are activated, then disqualify any autoplay that may be 
            // about to occur.
            //
            // For mouse activations, we have to register for `mousedown` to account for 
            // the user fast-forwarding or rewinding via the alternate functions of the 
            // Next and Previous buttons.
            //
            node.addEventListener("mousedown", bound);
            node.addEventListener("keypress", bound);
         }
         this.#seek_slider.addEventListener("change", bound);
      }
      
      this.#control_names_to_nodes = {
         loop:       this.#loop_button,
         mute:       this.#mute_button,
         next:       this.#next_button,
         prev:       this.#prev_button,
         seek:       this.#seek_slider,
         shuffle:    this.#shuffle_button,
         stop:       this.#stop_button,
         volume:     this.#volume_slider,
      };
   }
   
   async #dispatch(e) {
      let forwarded = new (e.constructor)(e.type, e);
      this.dispatchEvent(forwarded);
   }
   
   #dispatch_debounce_timers = {};
   async #dispatch_debounced(e) {
      let timer = this.#dispatch_debounce_timers[e.type];
      if (!timer) {
         timer = this.#dispatch_debounce_timers[e.type] = { last: -1, timeout: null };
      }
      if (timer.timeout) {
         window.clearTimeout(timer.timeout);
         timer.timeout = null;
      }
      let now = Date.now();
      if (now - timer.last < 500) {
         timer.timeout = window.setTimeout(this.#dispatch_debounced.bind(this, e), 500);
         return;
      }
      timer.last = now;
      await this.#dispatch(e);
   }
   
   async #dispatch_simple(name) {
      this.dispatchEvent(new Event(name));
   }
   
   //
   // State
   //
   
   #can_rewind() {
      if (!this.#has_current_playlist_item())
         return false;
      let item = this.#playlist.currentItem;
      if (item.audio_only)
         return false;
      return true;
   }
   #has_current_playlist_item() {
      if (this.#is_stopped)
         return false;
      if (this.#playlist.length == 0)
         return false;
      return true;
   }
   
   #update_content_type_classes() {
      let main = this.#shadow.querySelector(".main");
      let item = null;
      if (this.#playlist.length != 0) {
         item = this.#playlist.currentItem;
      }
      
      let is_video = false;
      if (item) {
         let tracks = this.#media.videoTracks;
         if (tracks && tracks.length > 0) {
            is_video = true;
         } else {
            if (this.#media.readyState < HTMLMediaElement.HAVE_METADATA) {
               //
               // Impossible for us to know if this is a video or if it's only 
               // audio. If we forge ahead anyway, then that'll cause flickering 
               // between video and non-video states when the user clicks Next 
               // to move from one video in a playlist to another.
               //
               return;
            }
            if (this.#media.videoWidth && this.#media.videoHeight) { // fallback
               is_video = true;
            }
         }
      }
      
      if (is_video) {
         main.classList.add("video");
      } else {
         main.classList.remove("video");
      }
   }
   
   //
   // Accessors
   //
   
   get autoplay() { return this.#autoplay; }
   set autoplay(v) {
      v = !!v;
      if (v == this.#autoplay)
         return;
      this.#autoplay = v;
      if (this.#has_ever_been_connected) {
         this.#setting_attribute = true;
         this[v ? "setAttribute" : "removeAttribute"]("autoplay", "autoplay");
         this.#setting_attribute = false;
      }
      if (this.isConnected) {
         this.#try_autoplay();
      }
   }
   #try_autoplay() {
      if (!this.#ready_to_autoplay)
         return;
      if (!this.#autoplay)
         return;
      if (!this.#playlist.size)
         return;
      if (this.#playlist.index != 0)
         return;
      if (!this.#media.paused)
         return;
      if (this.#media.currentTime != 0)
         return;
      this.#ready_to_autoplay = false;
      this.#media.play();
      this.#set_is_stopped(false);
      this.#dispatch_simple("play");
   }
   
   // Get the current playback rate, accounting for both the desired 
   // base rate (`playbackRate`) and for whether we're fast-forwarding.
   get currentPlaybackRate() { return this.#media.playbackRate; }
   
   get currentPlaylistIndex() { return this.#playlist.index; }
   set currentPlaylistIndex(v) { this.#playlist.index = v; }
   
   get fastForwardDelay() { return this.#fast_forward_delay; }
   set fastForwardDelay(v) {
      v = +v;
      if (v <= 0)
         throw new Error("invalid duration");
      this.#fast_forward_delay = v;
   }
   
   get fastForwardSpeed() { return this.#fast_forward_speed; }
   set fastForwardSpeed(v) {
      v = +v;
      if (v <= 1)
         throw new Error("fast-forward speed multiplier must be greater than 1");
      this.#fast_forward_speed = v;
      if (this.isFastForwarding) {
         this.#media.playbackRate = v;
      }
   }
   
   get isFastForwarding() { return this.#fast_playback_type > 0; }
   set isFastForwarding(v) {
      v = !!v;
      if (v) {
         this.#set_is_fast_playback(1);
      } else if (this.#fast_playback_type > 0) {
         this.#set_is_fast_playback(0);
      }
   }
   
   get muted() { return this.#media.muted; }
   set muted(v) {
      v = !!v;
      this.#media.muted = v;
      this.#mute_button.checked = v;
      this.#update_mute_tooltip(v);
      this.#update_mute_glyph(this.#volume_slider.value);
   }
   
   get playbackRate() { return this.#speed; }
   set playbackRate(raw) {
      let v = +raw;
      if (isNaN(v) || v <= 0)
         throw new Error(`playback rate must be a number greater than zero (seen: ${raw})`);
      this.#speed = v;
      if (!this.#fast_playback_type)
         this.#media.playbackRate = v;
      
      // Consistency with WMP internals: halt fast-forwarding if the playback 
      // rate is adjusted during fast-forwarding or fast-rewinding.
      //
      // Ref: https://learn.microsoft.com/en-us/previous-versions/windows/desktop/wmp/controls-fastreverse
      this.#cancel_queued_fast_playback();
      this.#set_is_fast_playback(0);
   }
   
   #controls_layout_setter(name, attr, v) {
      if (Array.isArray(v)) {
         v = v.join(" ");
      } else if (v !== null) {
         let u = v + "";
         if (v == u)
            v = v.trim();
         else
            v = u;
      }
      let prior = this.#controls_layout.requested[name];
      this.#controls_layout.requested[name] = v;
      this.#setting_attribute = true;
      this[v !== null ? "setAttribute" : "removeAttribute"](attr, v);
      this.#setting_attribute = false;
      if (prior !== v) {
         this.#update_controls_layout();
      }
   }
   
   get controlsInGutterRight() { return this.#controls_layout.computed.gutter_right; }
   set controlsInGutterRight(v) {
      this.#controls_layout_setter("gutter_right", "data-controls-in-gutter-right", v);
   }
   
   get controlsInTrayLeft() { return this.#controls_layout.computed.tray_left; }
   set controlsInTrayLeft(v) {
      this.#controls_layout_setter("tray_left", "data-controls-in-tray-left", v);
   }
   
   get controlsInTrayRight() { return this.#controls_layout.computed.tray_right; }
   set controlsInTrayRight(v) {
      this.#controls_layout_setter("tray_right", "data-controls-in-tray-right", v);
   }
   
   //
   // Public methods (not related to any specific feature)
   //
   
   play() {
      if (this.#playlist.size == 0)
         return;
      this.#media.play();
      this.#dispatch_simple("play");
   }
   pause() { this.#media.pause(); }
   stop() { this.#set_is_stopped(true); }
   
   //
   // Custom element lifecycle
   //
   
   #has_ever_been_connected = false;
   #ready_to_autoplay       = true;
   
   #disqualify_autoplay_on_playback_control_by_user(e) {
      //
      // If the user interacts with any part of the player that actually influences 
      // playback, e.g. the seek slider or play/pause button, then disqualify any 
      // pending autoplay. (We don't care about interactions with widgets that don't 
      // alter the flow of playback, e.g. the Shuffle button or the Volume slider.)
      //
      if (e) {
         if (e instanceof KeyboardEvent) {
            if (e.code != "Enter" && e.code != "Space")
               return;
         } else if (e instanceof MouseEvent) {
            if (e.button != 0)
               return;
         }
      }
      this.#ready_to_autoplay = false;
   }
   
   attributeChangedCallback(name, prior, after) {
      if (this.#setting_attribute)
         return;
      this.#media.setAttribute(name, after);
      
      if (name == "loop") {
         let state = after !== null;
         this.#loop_button.disabled = state;
         this.#update_prev_next_state(this.#media.currentTime);
         return;
      }
      if (name == "src") {
         //
         // We want to react to an initially present `src` attribute only (compare to 
         // the `value` attribute indicating defaults on a form element). However, the 
         // ordering of callbacks is not defined. In Firefox, if I observe the `src` 
         // attribute for this callback, then the `src` attribute will be available by 
         // the time our connectedCallback runs; however, if I don't observe the `src` 
         // attribute, then connectedCallback runs before Firefox has parsed, loaded, 
         // and applied the `src` attribute specified in the HTML file. I assume that 
         // other browsers are similarly messy; in general, the custom elements spec 
         // doesn't do a good job of clearly defining the ordering of lifecycle events.
         //
         if (after !== null && after) {
            let item = new WMPlaylistItem({ src: after });
            this.#playlist.replace([ item ]);
            this.#try_autoplay();
         }
         return;
      }
      
      if (name == "data-controls-in-tray-left") {
         if (after)
            after = after.trim();
         this.#controls_layout.requested.tray_left = after;
         this.#update_controls_layout();
         return;
      }
      if (name == "data-controls-in-tray-right") {
         if (after)
            after = after.trim();
         this.#controls_layout.requested.tray_right = after;
         this.#update_controls_layout();
         return;
      }
   }
   
   connectedCallback() {
      if (this.#has_ever_been_connected)
         return;
      this.#has_ever_been_connected = true;
      
      //
      // Copy all observed attributes from ourselves to the wrapped <media/> element.
      //
      for(let name of this.constructor.observedAttributes) {
         if (name == "autoplay" || name == "loop" || name == "src")
            continue;
         let attr = this.getAttribute(name);
         if (attr === null)
            continue;
         this.#media.setAttribute(name, attr);
      }
      
      this.#update_play_state();
      
      this.#mute_button.checked = this.#media.muted; // account for `defaultMuted`
      this.#update_mute_tooltip();
      this.#update_content_type_classes();
      
      window.setTimeout((function() {
         this.#ready_to_autoplay = false;
      }).bind(this), 500);
      
      // --- Initial status update ---
      // Use setTimeout to ensure the DOM is fully ready and initialStatusText from registry is likely set
      setTimeout(() => this.#update_parent_status(), 0); 
   }
   
   //
   // Fast playback (i.e. fast-rewind or fast-forward)
   //
   
   #queue_fast_playback(direction, delay) {
      if (this.#fast_playback_timeout !== null) {
         window.clearTimeout(this.#fast_playback_timeout);
      }
      this.#fast_playback_timeout = setTimeout(
         this.#set_is_fast_playback.bind(this, direction),
         delay * 1000
      );
   }
   #cancel_queued_fast_playback() {
      if (this.#fast_playback_timeout !== null) {
         clearTimeout(this.#fast_playback_timeout);
         this.#fast_playback_timeout = null;
      }
   }
   #set_is_fast_playback(direction) {
      if (direction == 0) {
         let changing = this.#fast_playback_type != 0;
         if (this.#fast_rewind_timeout) {
            clearTimeout(this.#fast_rewind_timeout);
            this.#fast_rewind_timeout = null;
         }
         this.#media.playbackRate = this.#speed;
         this.#fast_playback_type = 0;
         this.#prev_button.classList.remove("rewind");
         this.#next_button.classList.remove("fast-forward");
         if (changing) {
            if (this.#fast_playback_paused) {
               //
               // NOTE: We diverge from Windows Media Player's behavior here: we restore 
               // the playback state that the player was in before rewinding or fast-
               // forwarding, i.e. if you fast-forward while paused, you'll be paused 
               // when you stop fast-forwarding. Windows Media Player's behaviors are as 
               // follows:
               //
               //  - After rewinding, always resume playback.
               //
               //  - After fast-forwarding while paused, wait three seconds (identified by 
               //    Microsoft-employed behavioral scientists as the exact length of time 
               //    it takes for a user to assume the player will stay paused); then,
               //    resume playback.
               //
               this.#media.pause();
            } else {
               this.#media.play();
            }
         }
         this.#fast_playback_paused = false;
         return;
      }
      if (this.#fast_playback_type == 0) {
         this.#fast_playback_paused = this.#media.paused;
      }
      if (direction > 0) {
         this.#fast_playback_type = 1; // fast-forwarding
         //
         // Play the media at a fast speed. Simple enough.
         //
         this.#next_button.classList.add("fast-forward");
         this.#media.playbackRate = this.#fast_forward_speed;
         if (this.#media.paused) {
            this.#media.play();
         }
      } else {
         this.#fast_playback_type = -1; // rewinding
         //
         // As of this writing, most browsers don't support negative playback rates 
         // for backwards playback. Fortunately, we can design an alternate behavior 
         // for parity with Windows Media Player: pause the media, and then skip 
         // backwards through it at 500% speed (e.g. every second, jump the current 
         // time back by five seconds). WMP skips backwards through keyframes, but I 
         // don't know that we can do the same. We'll use a fixed timestep.
         //
         this.#prev_button.classList.add("rewind");
         {
            let duration = this.#media.duration;
            let interval = 0.5;
            if (duration) {
               interval = Math.min(0.5, duration / 10);
            }
            this.#fast_rewind_interval = interval;
         }
         this.#media.pause();
         this.#fast_rewind_handler();
      }
   }
   #fast_rewind_handler() {
      this.#fast_rewind_timeout = null;
      if (this.#fast_playback_type >= 0)
         return;
      
      let time = this.#media.currentTime;
      let skip = this.#fast_rewind_interval * 5;
      if (time > skip) {
         time -= skip;
      } else {
         time = 0;
      }
      this.#media.currentTime = time;
      if (time > 0) {
         this.#fast_rewind_timeout = setTimeout(this.#fast_rewind_handler.bind(this), this.#fast_rewind_interval * 1000);
      }
   }
   
   //
   // Playlist
   //
   
   #on_playlist_current_item_changed(e) {
      let item = e.detail.item;
      if (item) {
         item.populateMediaElement(this.#media);
         this.#current_playlist_index_started = false;
         this.#set_is_stopped(false);
         if (this.autoplay) {
            queueMicrotask(() => this.play());
         }
      } else {
         this.stop();
      }
      this.#update_parent_status();
   }
   #on_playlist_cleared() {
      this.#media.pause();
      this.#media.src = "";
      this.#set_is_stopped(true);
   }
   #on_playlist_replaced() {
      this.#media.pause();
   }
   
   #on_playlist_modified() {
      let no_media = this.#playlist.empty();
      if (no_media || this.#is_stopped || this.#media.currentTime === 0) {
         this.#stop_button.disabled = true;
         this.#hide_current_time_readout();
      } else {
         this.#stop_button.disabled = false;
      }
      this.#update_prev_next_state(no_media ? 0 : this.#media.currentTime);
   }
   
   addToPlaylist(item) { this.#playlist.add(item); }
   clearPlaylist() { this.#playlist.clear(); }
   
   toPrevMedia() {
      let playing = !this.#media.paused;
      if (!this.#playlist.toPrev())
         return;
      this.#set_is_stopped(false);
      if (playing)
         this.#media.play();
   }
   toNextMedia(ignore_shuffle) {
      let playing = !this.#media.paused;
      if (!this.#playlist.toNext(ignore_shuffle))
         return;
      this.#set_is_stopped(false);
      if (playing)
         this.#media.play();
   }
   
   //
   // Media events
   //
   
   #_last_prev_enable_state_check = 0;
   
   #on_loaded_metadata(e) {
      this.#media.width  = this.#media.videoWidth  || 0;
      this.#media.height = this.#media.videoHeight || 0;
      this.#update_content_type_classes();
      // Show video now that it's ready
      const main = this.#shadow.querySelector('.main');
      if (main) main.classList.remove('video-hidden');
      // Notify parent that the player is ready (metadata loaded)
      if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: "mediaPlayer-ready" }, "*");
      }
   }
   #on_duration_change(e) {
      let duration = this.#media.duration;
      this.#seek_slider.maximum = duration;
      this.#seek_slider.keyStep = duration / 5;
   }
   #on_current_time_change(e) {
      if (this.#seek_slider.is_being_edited())
         return;
      let time = this.#media.currentTime;
      this.#seek_slider.value = time;
      this.#update_current_time_readout(time);
      {
         let now = Date.now();
         if (now - this.#_last_prev_enable_state_check > 100) {
            this.#_last_prev_enable_state_check = now;
            this.#update_prev_next_state(time);
         }
      }
   }
   #on_volume_change(e) {
      if (this.#volume_slider.is_being_edited())
         return;
      let value = Math.floor(this.#media.volume * 100);
      this.#volume_slider.value = value;
      this.#update_mute_glyph(value);
   }
   
   #on_media_play(e) {
      this.#is_stopped = false; 
      this.#update_play_state(); 
      // Notify parent to stop scanline
      if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'media-play' }, '*');
      }
   }
   #on_media_ended(e) {
      //
      // WARNING: The `ended` event doesn't fire if a video has the HTML `loop` attribute, 
      // reaches its end, and loops. It only fires if the video isn't looping.
      //
      if (this.#playlist.toNext()) {
         this.#media.play();
         //
         // If you fast-forward past the end of a media item, you should still be fast-
         // forwarding when the next media item starts, for consistency with WMP.
         //
         // Changing the currently playing media can apparently reset `playbackRate`, but 
         // I don't see this documented anywhere, so I have to code defensively. *sigh*
         //
         // NOTE: This behavior will be inconvenient to test on Firefox thanks to a bug: 
         // https://bugzilla.mozilla.org/show_bug.cgi?id=1807968
         //
         // NOTE: This behavior will be inconvenient to test on Firefox thanks to a bug: 
         // https://bugzilla.mozilla.org/show_bug.cgi?id=1807968
         //
         if (this.#fast_playback_type > 0) {
            this.#media.playbackRate = this.#fast_forward_speed;
         } else {
            this.#media.playbackRate = this.#speed;
         }
      } else {
         this.#media.poster = ""; // clear any leftover poster from the last playlist item
      }
      this.#update_play_state();
   }
   
   //
   // Play/Pause button
   //
   
   #on_play_pause_click(e) {
      let will_play = this.#media.paused;
      if (will_play) {
         this.#media.play();
      } else {
         this.#media.pause();
      }
      this.#set_is_stopped(false);
      if (will_play) {
         this.#dispatch_simple("play");
      }
   }
   #update_play_state() {
      if (this.#is_stopped) {
         this.#play_pause_button.textContent = "Play";
         this.#play_pause_button.title = "Play";
         this.#internals.states.delete("playing");
         this.#internals.states.delete("paused");
         this.#internals.states.add("stopped");
         // Notify parent to resume scanline
         if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'media-stop' }, '*');
         }
      } else if (this.#media.paused) {
         this.#play_pause_button.textContent = "Play";
         this.#play_pause_button.title = "Play";
         this.#internals.states.delete("playing");
         this.#internals.states.add("paused");
         this.#internals.states.delete("stopped");
         // Notify parent to resume scanline
         if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'media-pause' }, '*');
         }
      } else {
         this.#play_pause_button.textContent = "Pause";
         this.#play_pause_button.title = "Pause";
         this.#internals.states.add("playing");
         this.#internals.states.delete("paused");
         this.#internals.states.delete("stopped");
         // Notify parent to stop scanline
         if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'media-play' }, '*');
         }
      }
      this.#update_parent_status(); // Update status bar based on final state
   }
   
   //
   // Helpers for Previous/Rewind and Next/Fast Foward buttons
   //
   
   #fast_playback_press_handler() {
      let handler = this.#bound_fast_playback_stop_on_release_handler;
      window.addEventListener("blur",    handler);
      window.addEventListener("mouseup", handler);
   }
   #fast_playback_stop_on_release_handler() {
      this.#set_is_fast_playback(0);
      let handler = this.#bound_fast_playback_stop_on_release_handler;
      window.removeEventListener("blur",    handler);
      window.removeEventListener("mouseup", handler);
   }
   
   //
   // Previous button
   //
   
   #on_prev_click() {
      if (this.#media.currentTime >= this.#previous_button_time_threshold) {
         this.#media.currentTime = 0;
         return;
      }
      this.toPrevMedia();
   }
   
   #on_prev_mousedown(e) {
      if (e.button != 0)
         return;
      if (this.#can_rewind()) {
         this.#queue_fast_playback(-1, this.#fast_forward_delay);
         this.#fast_playback_press_handler();
      }
   }
   #on_prev_mouseup(e) {
      if (e.button != 0)
         return;
      this.#cancel_queued_fast_playback();
      if (this.#fast_playback_type) {
         this.#set_is_fast_playback(0);
      } else {
         this.#on_prev_click();
      }
   }
   #on_prev_keypress(e) {
      if (e.altKey)
         return;
      if (e.code != "Enter" && e.code != "Space")
         return;
      e.preventDefault();
      this.#on_prev_click();
   }
   
   //
   // Next/Fast Forward button
   //
   
   #on_next_mousedown(e) {
      if (e.button != 0)
         return;
      this.#queue_fast_playback(1, this.#fast_forward_delay);
      this.#fast_playback_press_handler();
   }
   #on_next_mouseup(e) {
      if (e.button != 0)
         return;
      this.#cancel_queued_fast_playback();
      if (this.#fast_playback_type) {
         this.#set_is_fast_playback(0);
      } else {
         this.toNextMedia();
      }
   }
   #on_next_keypress(e) {
      if (e.altKey)
         return;
      if (e.code != "Enter" && e.code != "Space")
         return;
      //
      // NOTE: Windows Media Player exposes fast-forwarding via the keyboard 
      // shortcut Ctrl + Shift + F, not via keyboard interactions with the 
      // button itself. This differs from the mouse interactions.
      //
      e.preventDefault();
      this.toNextMedia();
   }
   
   //
   // Simple UI interactions
   //
   
   #on_seek_slider_change(e) {
      let time = this.#seek_slider.value;
      this.#media.currentTime = time;
      this.#update_current_time_readout(time);
      this.#set_is_stopped(false);
   }
   #on_volume_slider_change(e) {
      let value = this.#volume_slider.value;
      this.#media.volume = value / 100;
      this.#update_mute_glyph(value);
   }
   
   //
   // UI updates
   //
   
   #update_buffering_state(e) {
      if (e.name == "buffering") {
         this.#internals.states.add("buffering");
         this.#internals.states.delete("stalled");
      } else if (e.name == "stalled") {
         this.#internals.states.add("stalled");
         this.#internals.states.delete("buffering");
      } else {
         this.#internals.states.delete("stalled");
         this.#internals.states.delete("buffering");
      }
   }
   
   #hide_current_time_readout() {
      this.#current_time_readout.textContent = "";
      this.#current_time_readout.removeAttribute("datetime");
   }
   #update_current_time_readout(time) {
      if (this.#is_stopped) {
         this.#hide_current_time_readout();
         return;
      }
      time = +time || 0;
      let show_hours = (time >= 3600 || this.#media.duration >= 3600);
      let h     = 0;
      let m     = Math.floor((time % 3600) / 60);
      let s_sub = time % 60;
      let s     = Math.floor(s_sub);
      let text = (m+"").padStart(2, '0') + ':' + (s+"").padStart(2, '0');
      if (show_hours) {
         h = Math.floor(time / 3600);
         text = (h+"").padStart(2, '0') + ':' + text;
      }
      this.#current_time_readout.textContent = text;
      this.#current_time_readout.setAttribute("datetime", `P${h}H${m}M${s_sub}S`);
   }
   
   #update_mute_glyph(volume) {
      let node  = this.#mute_button;
      let glyph = "high";
      if (this.#media.muted) {
         glyph = "muted";
      } else {
         if (!volume) {
            glyph = "empty";
         } else if (volume < 33) {
            glyph = "low";
         } else if (volume < 66) {
            glyph = "medium";
         } else {
            glyph = "high";
         }
      }
      node.setAttribute("data-glyph", glyph);
   }
   
   #update_prev_state(current_time) {
      const TEXT_FOR_PREVIOUS_ONLY = "Previous";
      const TEXT_FOR_REWIND_ONLY   = "Press and hold to rewind";
      const TEXT_FOR_ALL_BEHAVIORS = "Previous (press and hold to rewind)";
      
      let node = this.#prev_button;
      if ((this.#is_stopped && this.#playlist.index == 0) || this.#playlist.size == 0) {
         //
         // Nothing playing.
         //
         node.classList.remove("can-only-rewind");
         node.disabled = true;
         node.title    = TEXT_FOR_ALL_BEHAVIORS;
         return;
      }
      node.disabled = false;
      node.classList.remove("can-only-rewind");
      if (this.#can_rewind()) {
         node.title = TEXT_FOR_ALL_BEHAVIORS;
      } else {
         node.title = TEXT_FOR_PREVIOUS_ONLY;
      }
   }
   #update_next_state() {
      const TEXT_FOR_FAST_FWD_ONLY = "Press and hold to fast-forward";
      const TEXT_FOR_ALL_BEHAVIORS = "Next (press and hold to fast-forward)";
      let node     = this.#next_button;
      node.disabled = true; // Always disabled
      node.title    = TEXT_FOR_ALL_BEHAVIORS;
   }
   #update_prev_next_state(current_time) {
      this.#update_prev_state(current_time);
      this.#update_next_state();
   }
   
   //
   // Controls layout
   //
   
   #update_controls_layout() {
      let layout    = this.#controls_layout;
      let requested = this.#controls_layout.requested;
      let computed  = this.#controls_layout.computed;
      let empty     = true;
      let used      = {};
      for(let key in this.#control_names_to_nodes) {
         used[key] = false;
      }
      {
         let handle_member = (function(name) {
            computed[name] = null;
            layout[name]   = [];
            
            let list = requested[name];
            if (!list) {
               if (list !== null)
                  empty = false;
               return;
            }
            list = list.split(" ");
            
            let first = true;
            for(let item of list) {
               let node;
               if (item == "separator") {
                  node = document.createElement("hr");
               } else {
                  node = this.#control_names_to_nodes[item];
                  if (!node || used[item]) {
                     continue;
                  }
                  used[item] = true;
               }
               
               empty = false;
               layout[name].push(node);
               if (first) {
                  computed[name] = item;
                  first = false;
               } else {
                  computed[name] += ' ' + item;
               }
            }
         }).bind(this);
         handle_member("tray_left");
         handle_member("tray_right");
         handle_member("gutter_right");
      }
      if (empty) {
         layout.tray_left = [
            this.#shuffle_button,
            this.#loop_button,
            document.createElement("hr"),
            this.#stop_button,
            this.#prev_button
         ];
         layout.tray_right = [
            this.#next_button,
            this.#mute_button,
            this.#volume_slider
         ];
         layout.gutter_right = [
         ];
      }
      
      function apply_member(name, container) {
         let frag = new DocumentFragment();
         for(let node of layout[name]) {
            frag.append(node);
         }
         container.replaceChildren(frag);
      }
      if (!used.seek) {
         this.#shadow.querySelector(".content").after(this.#seek_slider);
      }
      apply_member("tray_left",    this.#shadow.querySelector(".controls .left"));
      apply_member("tray_right",   this.#shadow.querySelector(".controls .right"));
      apply_member("gutter_right", this.#shadow.querySelector(".gutter-right .rearrangeables"));
   }
   
   #on_stop_click(e) {
      this.#set_is_stopped(true);
   }
   #on_mute_ui_toggled() {
      this.muted = this.#mute_button.checked;
   }
   #update_mute_tooltip(state) {
      let node = this.#mute_button;
      if (state === void 0)
         state = this.#media.muted;
      if (state) {
         node.title = "Sound";
      } else {
         node.title = "Mute";
      }
   }
   #set_is_stopped(v) {
      v = !!v;
      this.#is_stopped = v;
      if (v) {
         this.#playlist.index = 0;
         this.#media.pause();
         this.#update_play_state();
         this.#update_content_type_classes();
         this.#stop_button.disabled = true;
         this.#cancel_queued_fast_playback();
         this.#set_is_fast_playback(0);
         this.#hide_current_time_readout();
      } else {
         this.#stop_button.disabled = false;
      }
   }
   
   // --- Add helper for status bar updates ---
   #update_parent_status() {
       if (window.parent && window.parent !== window) {
           let statusText = "Stopped";
           const currentSrc = this.#media.src || "";
           const filename = currentSrc.substring(currentSrc.lastIndexOf('/') + 1) || "Unknown";

           if (!this.#is_stopped) {
               if (this.#media.paused) {
                   statusText = `Paused: ${filename}`;
               } else {
                   statusText = `Playing: ${filename}`;
               }
           }
           
           sendStatusBarUpdate(statusText);
       }
   }
   // --- End helper ---
   
   static get observedAttributes() {
      return [
         "autoplay",
         "loop",
         "src",
         "data-controls-in-tray-left",
         "data-controls-in-tray-right"
         // Add any other attributes you want to observe
      ];
   }
};
customElements.define(
   "wm-player",
   WMPlayerElement
);
// --- End mediaPlayer.js --- 

// Throttle status bar updates to parent
function sendStatusBarUpdate(statusText) {
  const now = Date.now();
  if (now - lastStatusUpdate > 1000) { // Only send once per second
    window.parent.postMessage({ type: 'updateStatusBar', text: statusText }, window.location.origin || '*');
    lastStatusUpdate = now;
  }
}