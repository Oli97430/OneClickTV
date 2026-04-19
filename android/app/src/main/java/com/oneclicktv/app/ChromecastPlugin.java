package com.oneclicktv.app;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.android.gms.cast.CastMediaControlIntent;
import com.google.android.gms.cast.MediaInfo;
import com.google.android.gms.cast.MediaLoadRequestData;
import com.google.android.gms.cast.MediaMetadata;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.CastState;
import com.google.android.gms.cast.framework.CastStateListener;
import com.google.android.gms.cast.framework.SessionManager;
import com.google.android.gms.cast.framework.SessionManagerListener;
import com.google.android.gms.cast.framework.media.MediaIntentReceiver;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;
import com.google.android.gms.common.images.WebImage;

import android.net.Uri;
import androidx.mediarouter.app.MediaRouteChooserDialog;

@CapacitorPlugin(name = "Chromecast")
public class ChromecastPlugin extends Plugin {

    private static final String TAG = "ChromecastPlugin";

    private CastContext castContext;
    private SessionManager sessionManager;
    private CastStateListener castStateListener;
    private SessionManagerListener<CastSession> sessionManagerListener;

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    @Override
    public void load() {
        getActivity().runOnUiThread(() -> {
            try {
                castContext = CastContext.getSharedInstance(getContext());
                sessionManager = castContext.getSessionManager();

                castStateListener = newState -> notifyCastState(newState);

                sessionManagerListener = new SessionManagerListener<CastSession>() {
                    @Override public void onSessionStarting(CastSession s) { notifyCastState(CastState.CONNECTING); }
                    @Override public void onSessionStarted(CastSession s, String id) { notifyCastState(CastState.CONNECTED); }
                    @Override public void onSessionStartFailed(CastSession s, int err) { notifyCastState(CastState.NOT_CONNECTED); }
                    @Override public void onSessionEnding(CastSession s) {}
                    @Override public void onSessionEnded(CastSession s, int err) { notifyCastState(CastState.NOT_CONNECTED); }
                    @Override public void onSessionResuming(CastSession s, String id) { notifyCastState(CastState.CONNECTING); }
                    @Override public void onSessionResumed(CastSession s, boolean w) { notifyCastState(CastState.CONNECTED); }
                    @Override public void onSessionResumeFailed(CastSession s, int err) { notifyCastState(CastState.NOT_CONNECTED); }
                    @Override public void onSessionSuspended(CastSession s, int r) {}
                };

                castContext.addCastStateListener(castStateListener);
                sessionManager.addSessionManagerListener(sessionManagerListener, CastSession.class);

            } catch (Exception e) {
                Log.e(TAG, "Cast init error: " + e.getMessage());
            }
        });
    }

    @Override
    protected void handleOnDestroy() {
        if (castContext != null && castStateListener != null) {
            castContext.removeCastStateListener(castStateListener);
        }
        if (sessionManager != null && sessionManagerListener != null) {
            sessionManager.removeSessionManagerListener(sessionManagerListener, CastSession.class);
        }
    }

    // ─── Plugin methods ───────────────────────────────────────────────────────

    /** Retourne l'état Cast courant au JS */
    @PluginMethod
    public void getState(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            JSObject ret = new JSObject();
            ret.put("state", getCastStateString());
            call.resolve(ret);
        });
    }

    /** Ouvre le sélecteur d'appareils Cast natif */
    @PluginMethod
    public void requestSession(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                // Ouvre le dialog de sélection d'appareil Cast
                MediaRouteChooserDialog dialog = new MediaRouteChooserDialog(getActivity());
                dialog.setRouteSelector(
                    castContext.getMergedSelector() != null
                        ? castContext.getMergedSelector()
                        : new androidx.mediarouter.media.MediaRouteSelector.Builder()
                            .addControlCategory(CastMediaControlIntent.categoryForCast(
                                CastMediaControlIntent.DEFAULT_MEDIA_RECEIVER_APPLICATION_ID))
                            .build()
                );
                dialog.show();
                call.resolve();
            } catch (Exception e) {
                call.reject("Impossible d'ouvrir le sélecteur Cast: " + e.getMessage());
            }
        });
    }

    /** Charge un flux HLS sur la session Cast active */
    @PluginMethod
    public void loadMedia(PluginCall call) {
        String url      = call.getString("url");
        String title    = call.getString("title", "");
        String imageUrl = call.getString("imageUrl", null);

        if (url == null || url.isEmpty()) {
            call.reject("url manquant");
            return;
        }

        getActivity().runOnUiThread(() -> {
            try {
                CastSession session = sessionManager.getCurrentCastSession();
                if (session == null || !session.isConnected()) {
                    call.reject("Pas de session Cast active");
                    return;
                }

                MediaMetadata metadata = new MediaMetadata(MediaMetadata.MEDIA_TYPE_GENERIC);
                metadata.putString(MediaMetadata.KEY_TITLE, title);
                if (imageUrl != null && !imageUrl.isEmpty()) {
                    metadata.addImage(new WebImage(Uri.parse(imageUrl)));
                }

                MediaInfo mediaInfo = new MediaInfo.Builder(url)
                    .setStreamType(MediaInfo.STREAM_TYPE_LIVE)
                    .setContentType("application/x-mpegURL")
                    .setMetadata(metadata)
                    .build();

                RemoteMediaClient client = session.getRemoteMediaClient();
                if (client != null) {
                    client.load(new MediaLoadRequestData.Builder()
                        .setMediaInfo(mediaInfo)
                        .setAutoplay(true)
                        .build());
                }
                call.resolve();
            } catch (Exception e) {
                call.reject("Erreur loadMedia: " + e.getMessage());
            }
        });
    }

    /** Met fin à la session Cast */
    @PluginMethod
    public void endSession(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                sessionManager.endCurrentSession(true);
                call.resolve();
            } catch (Exception e) {
                call.reject("Erreur endSession: " + e.getMessage());
            }
        });
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void notifyCastState(int state) {
        JSObject data = new JSObject();
        data.put("state", castStateToString(state));
        notifyListeners("castStateChanged", data);
    }

    private String getCastStateString() {
        if (castContext == null) return "unavailable";
        return castStateToString(castContext.getCastState());
    }

    private String castStateToString(int state) {
        switch (state) {
            case CastState.NO_DEVICES_AVAILABLE: return "no_devices";
            case CastState.NOT_CONNECTED:        return "not_connected";
            case CastState.CONNECTING:           return "connecting";
            case CastState.CONNECTED:            return "connected";
            default:                             return "unavailable";
        }
    }
}
