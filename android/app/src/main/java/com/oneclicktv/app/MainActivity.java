package com.oneclicktv.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(ChromecastPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
