package com.pinecil.companion;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Build;
import android.view.View;
import android.view.ViewParent;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Exposes Android 12+ "Material You" system colours (derived from the user's
 * wallpaper) to the web layer, so the app can re-tone itself to match the OS.
 */
@CapacitorPlugin(name = "SystemTheme")
public class SystemThemePlugin extends Plugin {

    @PluginMethod
    public void getAccent(PluginCall call) {
        JSObject ret = new JSObject();
        boolean supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S; // API 31
        ret.put("supported", supported);
        if (supported) {
            int color = getContext().getColor(android.R.color.system_accent1_500);
            ret.put("color", String.format("#%06X", 0xFFFFFF & color));
        } else {
            ret.put("color", (String) null);
        }
        call.resolve(ret);
    }

    /** System bar inset heights (status bar top, gesture/nav bar bottom) in CSS px. */
    @PluginMethod
    public void getInsets(final PluginCall call) {
        getActivity().runOnUiThread(() -> {
            JSObject ret = new JSObject();
            float density = getContext().getResources().getDisplayMetrics().density;
            int top = 0, bottom = 0;
            View decor = getActivity().getWindow().getDecorView();
            WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(decor);
            if (insets != null) {
                Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
                top = Math.round(bars.top / density);
                bottom = Math.round(bars.bottom / density);
            }
            ret.put("top", top);
            ret.put("bottom", bottom);
            call.resolve(ret);
        });
    }

    /** Paint the window background (shows behind the transparent system bars). */
    @PluginMethod
    public void setWindowBackground(final PluginCall call) {
        final String color = call.getString("color", "#141218");
        getActivity().runOnUiThread(() -> {
            try {
                int c = Color.parseColor(color);
                getActivity().getWindow().setBackgroundDrawable(new ColorDrawable(c));
                // Paint BOTH bars the surface colour so neither shows a black band.
                getActivity().getWindow().setStatusBarColor(c);
                getActivity().getWindow().setNavigationBarColor(c);
                // Paint the WebView and every ancestor view: whichever view owns
                // the status/nav-bar inset strip ends up surface-coloured.
                View v = getBridge().getWebView();
                while (v != null) {
                    v.setBackgroundColor(c);
                    ViewParent p = v.getParent();
                    v = (p instanceof View) ? (View) p : null;
                }
            } catch (Exception ignored) {
            }
            call.resolve();
        });
    }
}
