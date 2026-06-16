package com.oneclicktv.app;

import com.getcapacitor.BridgeActivity;
import android.app.PictureInPictureParams;
import android.content.res.Configuration;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Rational;

public class MainActivity extends BridgeActivity {

    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private boolean isPlayingBeforeFocusLoss = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(ChromecastPlugin.class);
        super.onCreate(savedInstanceState);

        audioManager = (AudioManager) getSystemService(AUDIO_SERVICE);
        setupAudioFocus();
    }

    // ─── PiP ─────────────────────────────────────────────────────────────

    @Override
    public void onUserLeaveHint() {
        super.onUserLeaveHint();
        enterPipIfPlaying();
    }

    private void enterPipIfPlaying() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        try {
            PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder();
            builder.setAspectRatio(new Rational(16, 9));
            enterPictureInPictureMode(builder.build());
        } catch (Exception ignored) {}
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPipMode, Configuration newConfig) {
        super.onPictureInPictureModeChanged(isInPipMode, newConfig);
        if (getBridge() != null && getBridge().getWebView() != null) {
            String js = isInPipMode
                ? "window.dispatchEvent(new CustomEvent('pipmodechange', {detail:{pip:true}}))"
                : "window.dispatchEvent(new CustomEvent('pipmodechange', {detail:{pip:false}}))";
            getBridge().getWebView().evaluateJavascript(js, null);
        }
    }

    // ─── Audio Focus ─────────────────────────────────────────────────────

    private void setupAudioFocus() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        AudioAttributes attrs = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_MOVIE)
            .build();

        audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
            .setAudioAttributes(attrs)
            .setOnAudioFocusChangeListener(focusChange -> {
                if (getBridge() == null || getBridge().getWebView() == null) return;
                switch (focusChange) {
                    case AudioManager.AUDIOFOCUS_LOSS:
                    case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
                        getBridge().getWebView().evaluateJavascript(
                            "document.querySelectorAll('video,audio').forEach(v=>v.pause())", null);
                        isPlayingBeforeFocusLoss = true;
                        break;
                    case AudioManager.AUDIOFOCUS_GAIN:
                        if (isPlayingBeforeFocusLoss) {
                            getBridge().getWebView().evaluateJavascript(
                                "document.querySelectorAll('video,audio').forEach(v=>v.play().catch(()=>{}))", null);
                            isPlayingBeforeFocusLoss = false;
                        }
                        break;
                }
            })
            .build();

        audioManager.requestAudioFocus(audioFocusRequest);
    }

    @Override
    public void onDestroy() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
        }
        super.onDestroy();
    }
}
